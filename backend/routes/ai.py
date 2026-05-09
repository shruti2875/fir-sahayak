from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session 
from datetime import date
import base64
import io

from backend.services.llm import (
    generate_fir, 
    generate_fir_with_context,
    analyze_image_with_vision,
    generate_fir_pdf
)
from backend.schemas.schemas import (
    AIRequest, 
    ImageAnalysisResponse,
    PDFDownloadRequest
)
from backend.services.embedding import get_embedding
from backend.db.database import SessionLocal, get_db
from backend.models.models import FIR, AIAnalysis, PoliceOfficer


router = APIRouter(prefix="/ai")


@router.post("/generate")
def ai_generate(request: AIRequest, db: Session = Depends(get_db)):
    """Simple FIR generation (fallback)"""
    # Fetch officer data
    officer = db.query(PoliceOfficer).first()
    officer_details = {
        "officer_name": officer.name if officer else "Officer",
        "station_name": officer.station.station_name if officer and officer.station else request.station_name or "[Station]",
        "station_location": officer.station.location if officer and officer.station else request.complainant_address or "[Location]",
    }
    
    result = generate_fir(
        request.description,
        request.language or "en",
        officer_details=officer_details
    )
    return {"result": result}


@router.post("/missing-info")
def get_missing_info(request: AIRequest, db: Session = Depends(get_db)):
    """Get missing information for a complaint"""
    # Fetch officer data (optional for this endpoint)
    officer = db.query(PoliceOfficer).first()
    officer_details = {
        "officer_name": officer.name if officer else "Officer",
        "station_name": officer.station.station_name if officer and officer.station else "[Station]",
        "station_location": officer.station.location if officer and officer.station else "[Location]",
    }
    
    result = generate_fir_with_context(
        request.description,
        [],
        request.language or "en",
        officer_details=officer_details
    )
    return {"missing_info": result["missing_info"]}
    
    

@router.post("/generate-smart")
def generate_smart_fir(request: AIRequest, db: Session = Depends(get_db)):

    # ── STEP 1: Fetch officer + station from DB ──────────────────────────────
    officer = None

    if request.station_name:
        officer = (
            db.query(PoliceOfficer)
            .join(PoliceOfficer.station)
            .filter(PoliceOfficer.station.has(station_name=request.station_name))
            .first()
        )

    if not officer:
        officer = db.query(PoliceOfficer).first()

    if officer and officer.station:
        officer_details = {
            "officer_name":     officer.name,
            "officer_rank":     officer.rank or "Sub-Inspector",
            "officer_contact":  officer.contact or request.complainant_contact or "",
            "station_name":     officer.station.station_name,
            "station_location": officer.station.location,
            "station_contact":  officer.station.contact_number or "",
        }
    else:
        officer_details = {
            "officer_name":     request.complainant_name or "Officer",
            "officer_rank":     "Sub-Inspector",
            "officer_contact":  request.complainant_contact or "",
            "station_name":     request.station_name or "Police Station",
            "station_location": request.complainant_address or "",
            "station_contact":  "",
        }

    # ── STEP 2: Vector search for similar cases ──────────────────────────────
    query_embedding = str(get_embedding(request.description))

    rows = db.execute(text("""
        SELECT fir_id, description, incident_location,
               embedding <-> CAST(:emb AS vector) AS distance
        FROM firs
        ORDER BY distance
        LIMIT 5
    """), {"emb": query_embedding}).fetchall()

    seen: set = set()
    unique_cases = []

    for row in rows:
        desc = row[1]
        location = row[2]
        dist = float(row[3])
        if desc not in seen and dist < 1.2:
            seen.add(desc)
            unique_cases.append({
                "fir_id": row[0],
                "description": desc,
                "location": location,
                "score": dist,
            })

    similar_cases = sorted(unique_cases, key=lambda x: x["score"])
    score = similar_cases[0]["score"] if similar_cases else 2.0
    confidence = "High" if score < 0.8 else "Medium"
    confidence_score = round(max(0.0, 1.0 - score), 2)

    # ── STEP 3: Generate FIR ─────────────────────────────────────────────────
    output = generate_fir_with_context(
        text=request.description,
        similar_cases=similar_cases,
        language=request.language or "en",
        officer_details=officer_details,
    )

    # ── STEP 4: Persist to DB (best-effort) ──────────────────────────────────
    try:
        fir_record = FIR(
            officer_id=officer.officer_id if officer else None,
            description=request.description,
            generated_fir=output.get("fir", ""),
            crime_type="General Complaint",
            incident_location=officer_details["station_location"],
            date=date.today(),
            status="Registered",
            created_at=date.today(),
        )
        db.add(fir_record)
        db.flush()

        missing_str = ", ".join(output.get("missing_info", []))
        suggestions_str = ", ".join(output.get("suggestions", []))

        analysis_record = AIAnalysis(
            fir_id=fir_record.fir_id,
            missing_information=missing_str,
            suggestions=suggestions_str,
            predicted_crime_category="General",
            confidence_score=float(confidence_score),
            analysis_date=date.today(),
        )
        db.add(analysis_record)

        db.execute(text("""
            INSERT INTO chat_history (fir_id, message, role)
            VALUES (:fir_id, :message, :role)
        """), {"fir_id": fir_record.fir_id, "message": request.description, "role": "user"})

        db.execute(text("""
            INSERT INTO chat_history (fir_id, message, role)
            VALUES (:fir_id, :message, :role)
        """), {"fir_id": fir_record.fir_id, "message": output.get("fir", ""), "role": "assistant"})

        db.commit()
        print(f"DB save OK — fir_id={fir_record.fir_id}")
    except Exception as e:
        print(f"DB save error (non-fatal): {e}")
        db.rollback()

    # ── STEP 5: Return ───────────────────────────────────────────────────────
    return {
        "fir":              output.get("fir", ""),
        "missing_info":     output.get("missing_info", []),
        "suggestions":      output.get("suggestions", []),
        "confidence":       confidence,
        "confidence_score": confidence_score,
        "similar_cases":    similar_cases,
        "input":            request.description,
    }

# ✅ NEW: Image Analysis Endpoint
@router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    description: str = "",
    language: str = "en"
):
    """
    Analyze evidence image using Gemini Vision API
    
    - file: Image file (JPEG, PNG)
    - description: Optional text description
    - language: en/hi/mr
    """
    try:
        # Read image and convert to base64
        image_data = await file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Analyze using Gemini Vision
        result = analyze_image_with_vision(image_base64, description, language)
        
        return {
            "extracted_info": result.get("extracted_info", ""),
            "suggestions": result.get("suggestions", "")
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "extracted_info": "Failed to analyze image",
            "suggestions": "Please try with a different image"
        }

# ✅ NEW: PDF Download Endpoint
@router.post("/download-pdf")
async def download_pdf(request: PDFDownloadRequest):
    """
    Generate and download FIR as PDF
    
    Input:
    - fir_text: Complete FIR text
    - complainant_name: (Optional) Name of complainant
    - incident_date: (Optional) Date of incident
    - incident_location: (Optional) Location of incident
    """
    try:
        pdf_buffer = generate_fir_pdf(
            request.fir_text,
            request.complainant_name or "Officer",
            request.incident_date or "",
            request.incident_location or "",
            "en"
        )
        
        pdf_bytes = pdf_buffer.getvalue()
        
        if not pdf_bytes or len(pdf_bytes) == 0:
            raise ValueError("PDF generation produced empty content")
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=FIR_Report.pdf",
                "Content-Length": str(len(pdf_bytes)),
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except Exception as e:
        import traceback
        print(f"PDF Generation Error: {e}")
        traceback.print_exc()
        return Response(
            content=f'{{"error": "{str(e)}", "message": "Failed to generate PDF"}}',
            status_code=500,
            media_type="application/json"
        )
    
    
    
    
@router.get("/rights")
def know_rights():
    return {
        "rights": [
            {
                "title": "Right to File FIR",
                "description": "You can file an FIR at any police station regardless of jurisdiction."
            },
            {
                "title": "Free Copy of FIR",
                "description": "You are entitled to receive a free copy of your FIR."
            },
            {
                "title": "Mandatory Registration",
                "description": "Police must register FIR for cognizable offenses."
            },
            {
                "title": "Track FIR Status",
                "description": "You can track your FIR status online or at the police station."
            }
        ]
    }
    
    
@router.get("/jurisdiction")
def get_jurisdiction(location: str):

    location = location.lower()

    if "college" in location:
        station = "Shivajinagar Police Station"
    elif "bus" in location:
        station = "Swargate Police Station"
    else:
        station = "Nearest Police Station"

    return {
        "location": location,
        "recommended_station": station
    }
    
    
    
@router.get("/chat/{fir_id}")
def get_chat(fir_id: int, db: Session = Depends(get_db)):

    rows = db.execute(text("""
        SELECT message, role
        FROM chat_history
        WHERE fir_id = :fir_id
        ORDER BY created_at ASC
    """), {"fir_id": fir_id}).fetchall()

    return {
        "chat": [
            {
                "content": row[0],
                "role": row[1]
            }
            for row in rows
        ]
    }
    
    
@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):

    rows = db.execute(text("""
        SELECT incident_location, COUNT(*) as total
        FROM firs
        GROUP BY incident_location
        ORDER BY total DESC
        LIMIT 5
    """)).fetchall()

    return {
        "hotspots": [
            {
                "location": row[0],
                "count": row[1]
            }
            for row in rows
        ]
    }