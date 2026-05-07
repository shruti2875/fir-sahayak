from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 
from backend.db.database import get_db
from backend.models.models import FIR
from backend.schemas.schemas import FIRCreate, FIRResponse, SearchRequest
from backend.services.embedding import get_embedding
from sqlalchemy import text


router = APIRouter(prefix="/fir")

@router.post("/", response_model=FIRResponse)
def create_fir(fir: FIRCreate, db: Session = Depends(get_db)):
    
    embedding = get_embedding(fir.description)
    
    new_fir = FIR(
                    **fir.model_dump(), 
                    embedding = embedding
                )
    db.add(new_fir)
    db.commit()
    db.refresh(new_fir)
    
    return new_fir


@router.get("/{fir_id}")
def get_fir(fir_id: int, db: Session = Depends(get_db)):
    try:
        fir = db.query(FIR).filter(FIR.fir_id == fir_id).first()

        if not fir:
            raise HTTPException(status_code=404, detail="FIR not found")

        return fir

    except Exception as e:
        return {"error": str(e)}


@router.post("/search")
def search_similar(request: SearchRequest, db: Session = Depends(get_db)): 
    
    query_embedding = get_embedding(request.text_input)

    query_embedding = str(query_embedding)
    
    result = db.execute(text("""
    SELECT fir_id, description,
    embedding <-> CAST(:embedding AS vector) AS distance
    FROM firs
    WHERE embedding <-> CAST(:embedding AS vector) < 1.0
    ORDER BY distance
    LIMIT 5
"""), {"embedding": query_embedding}).fetchall()

    # ✅ Convert to JSON serializable format
    output = []
    for row in result:
        output.append({
            "fir_id": row[0],
            "description": row[1],
            "distance": float(row[2])
        })

    return output



        
    
