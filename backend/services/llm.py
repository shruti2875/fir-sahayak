
import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory regardless of where uvicorn is launched from
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

API_KEY = os.getenv("MISTRAL_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if not API_KEY:
    print("WARNING: MISTRAL_API_KEY not set — FIR generation will fail")

def parse_llm_response(content: str) -> dict:
    """Parse LLM JSON response. missing_info and suggestions stay as lists."""
    def to_list(value) -> list:
        """Always return a list of non-empty strings."""
        if isinstance(value, list):
            return [str(v).strip() for v in value if v]
        if isinstance(value, str) and value.strip():
            # Split newline-separated or comma-separated strings into list items
            items = [s.strip() for s in value.replace("\n", ",").split(",") if s.strip()]
            return items
        return []

    try:
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()

        # Extract JSON only
        start = content.find("{")
        end = content.rfind("}") + 1

        if start != -1 and end != -1:
            content = content[start:end]
    
        data = json.loads(content)

        fir_data = data.get("fir", "")
        if isinstance(fir_data, dict):
            fir_data = "\n".join(f"{k}: {v}" for k, v in fir_data.items())

        return {
            "fir": str(fir_data).strip(),
            "missing_info": to_list(data.get("missing_info")),
            "suggestions": to_list(data.get("suggestions"))
        }

    except Exception as e:
        print(f"parse_llm_response error: {e}")
        return {
            "fir": content,
            "missing_info": ["Could not parse response"],
            "suggestions": ["Please try again"]
        }


# ✅ Get language-specific instruction
def get_language_instruction(language: str) -> str:
    """
    Returns strong language instructions
    for multilingual FIR generation
    """

    if language == "hi":
        return """
Generate the FIR in formal Hindi language
using official Indian police complaint style.

Requirements:
- Use professional Hindi
- Use realistic police terminology
- Maintain FIR structure
- Avoid casual language
"""

    elif language == "mr":
        return """
मराठीत अधिकृत पोलिस FIR स्वरूपात उत्तर द्या.

सूचना:
- व्यावसायिक आणि औपचारिक भाषा वापरा
- वास्तविक पोलिस FIR शैली वापरा
- अनौपचारिक शब्द टाळा
- FIR चे योग्य स्वरूप ठेवा
"""

    return """
Generate the FIR in formal professional English
using official Indian police complaint format.

Requirements:
- Use realistic FIR wording
- Maintain professional tone
- Use proper legal/police style
- Avoid robotic AI-style language
"""

# ✅ Basic FIR generation
def generate_fir(
    text: str,
    language: str = "en",
    officer_details: dict = None,
    complainant_name: str = "",
    complainant_address: str = "",
    complainant_contact: str = "",
    station_name: str = ""
):
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # ✅ USE OFFICER DETAILS IF PROVIDED
    if officer_details is None:
        officer_details = {}
    
    lang_instruction = get_language_instruction(language)
    name    = officer_details.get("officer_name") or complainant_name or "[Complainant Name]"
    address = officer_details.get("station_location") or complainant_address or "[Full Address]"
    contact = officer_details.get("officer_contact") or complainant_contact or "[Contact Number]"
    station = officer_details.get("station_name") or station_name or "[Police Station Name]"

    prompt = f"""
You are a formal police FIR drafting assistant.

{lang_instruction}

Generate a complete, formal FIR using EXACTLY this format:

TO,
The Officer In-Charge
{station}
[City]

Date: [Date of Filing]

Subject: Request for registration of FIR

Respected Sir/Madam,

I, {name}, residing at {address}, contact number {contact}, would like to report the following incident:

DETAILS OF THE INCIDENT:

* Date and Time: [Date & Time]
* Location: [Exact Location]
* Description: [Clear description of incident]
* Stolen Item(s) / Damage: [Items or damage if applicable]

The incident occurred when [brief explanation based on complaint].

I request you to kindly register this complaint and take necessary action at the earliest.

Thanking you.

Yours sincerely,
{name}
[Signature]

---

User Complaint:
{text}

Rules:
- Fill ALL placeholders using complaint details
- Use [placeholder] only when info is truly missing
- Keep language formal and professional
- Return ONLY raw JSON, no markdown, no code blocks

JSON format:
{{
  "fir": "complete formatted FIR text",
  "missing_info": ["item1", "item2"],
  "suggestions": ["suggestion1", "suggestion2"]
}}
"""

    data = {
        "model": "mistral-small",
        "messages": [{"role": "user", "content": prompt}]
    }
    response = requests.post(url, headers=headers, json=data)
    res = response.json()
    print("DEBUG:", res)
    content = res["choices"][0]["message"]["content"]
    return parse_llm_response(content)


# ✅ FIR generation with context (RAG) - MULTILINGUAL - WITH REAL OFFICER DATA
def generate_fir_with_context(
    text: str,
    similar_cases: list,
    language: str = "en",
    officer_details: dict = None,
    complainant_name: str = "",
    complainant_address: str = "",
    complainant_contact: str = "",
    station_name: str = ""
):
    from datetime import datetime

    today_date = datetime.now().strftime("%d %B %Y")
    """
    Generate formal FIR with REAL officer data (NO PLACEHOLDERS)
    
    officer_details dict should contain:
    - officer_name: str
    - officer_rank: str
    - officer_contact: str
    - station_name: str
    - station_location: str
    - station_contact: str
    """
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # ✅ USE OFFICER DETAILS IF PROVIDED, OTHERWISE FALLBACK
    if officer_details is None:
        officer_details = {}
    
    officer_name = officer_details.get("officer_name", complainant_name or "Officer")
    officer_rank = officer_details.get("officer_rank", "Sub-Inspector")
    officer_contact = officer_details.get("officer_contact", complainant_contact or "[Contact]")
    station_name_val = officer_details.get("station_name", station_name or "[Station Name]")
    station_location = officer_details.get("station_location", complainant_address or "[Location]")
    station_contact = officer_details.get("station_contact", "[Station Contact]")
    
    context = "\n".join([
        f"""
    Case ID: {case.get('fir_id')}
    Description: {case.get('description')}
    Location: {case.get('location', 'Unknown')}
    Similarity Score: {round(case.get('score', 0), 2)}
    """
        for case in similar_cases
    ]) or "None"
    lang_instruction = get_language_instruction(language)
    complainant_name_val = (
    complainant_name
    if complainant_name
    else "Not mentioned in complaint"
)

    complainant_address_val = (
        complainant_address
        if complainant_address
        else "Not mentioned in complaint"
    )

    complainant_contact_val = (
        complainant_contact
        if complainant_contact
        else "Not mentioned in complaint"
    )

    # ✅ OFFICIAL INDIAN POLICE FIR FORMAT - NO PLACEHOLDERS
    prompt = f"""
You are an expert police FIR drafting assistant for Indian Police.

{lang_instruction}

=== POLICE STATION DETAILS (REAL DATA) ===
Officer Name: {officer_name}
Officer Rank: {officer_rank}
Station Name: {station_name_val}
Station Address: {station_location}
Station Contact: {station_contact}
Officer Contact: {officer_contact}

=== USER COMPLAINT ===
{text}

=== SIMILAR FIR EXAMPLES (REFERENCE ONLY) ===
{context}

=== INSTRUCTIONS ===
Generate a COMPLETE, FORMAL, OFFICIAL FIR using EXACTLY this format. 
DO NOT USE PLACEHOLDERS - FILL ALL FIELDS WITH PROVIDED DATA ABOVE.

---
FIR FORMAT:

TO,
The Officer In-Charge
{station_name_val}
{station_location}

Date: {today_date}

Subject: Complaint regarding reported incident

Respected Sir/Madam,

I, {complainant_name_val},
residing at {complainant_address_val},
Contact Number: {complainant_contact_val},
would like to report the following incident:

DETAILS OF THE INCIDENT:

* Date and Time: [Extract from complaint if available]
* Location: [Extract exact location from complaint]
* Description: [Write a clear, formal, professional description based on complaint]
* Items Involved: [Mention stolen/damaged items if any]
* Witnesses: [Mention if available, otherwise write "None mentioned"]

I request you to kindly register this complaint and take necessary legal action regarding the matter.

Thanking You.

Yours faithfully,

[Complainant Name]

---

Received By:

{officer_name}
{officer_rank}
{station_name_val}
Contact: {officer_contact}

---

=== STRICT REQUIREMENTS ===

1. FIR MUST be written from COMPLAINANT perspective
2. Police officer details should ONLY appear in footer/signature
3. NEVER make officer the complainant
4. NEVER use fake ranks like "3 star"
5. Use official Indian police complaint style
6. If information is missing, write "Not mentioned in complaint"
7. Keep FIR realistic and professional
8. missing_info MUST be JSON array
9. suggestions MUST be JSON array
10. Return ONLY valid raw JSON
11. NO markdown
12. NO triple backticks
13. FIR must look like an actual Indian police complaint document
14. Use realistic wording used in police complaints
15. Avoid robotic or AI sounding language
16. Never repeat the complaint unnecessarily
17. Use concise professional paragraphs
18. Do not invent facts not present in complaint

=== JSON RESPONSE FORMAT ===
{{
  "fir": "complete formatted FIR text exactly as shown above, preserving all newlines and formatting",
  "missing_info": ["specific missing information 1", "specific missing information 2"],
  "suggestions": ["investigation action 1", "investigation action 2", "legal article to apply"]
}}

Remember: This is a REAL FIR for official Indian police use. Be professional and accurate.
"""

    data = {
        "model": "mistral-small",
        "messages": [{"role": "user", "content": prompt}]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        res = response.json()

        if response.status_code == 401:
            raise ValueError("Mistral API key is invalid or expired. Update MISTRAL_API_KEY in backend/.env")
        if response.status_code != 200:
            raise ValueError(f"Mistral API error {response.status_code}: {res}")
        if "choices" not in res:
            raise ValueError(f"Unexpected Mistral response: {res}")

        content = (
            res.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        return parse_llm_response(content)
    except ValueError:
        raise
    except Exception as e:
        print(f"Mistral request error: {e}")
        return {
            "fir": f"Error generating FIR: {str(e)}",
            "missing_info": ["Could not generate FIR"],
            "suggestions": ["Please try again"]
        }

# ✅ IMAGE ANALYSIS USING GEMINI VISION API
def analyze_image_with_vision(image_base64: str, description: str = "", language: str = "en"):
    """
    Analyze evidence image using Gemini Vision API
    Returns extracted info and suggestions
    """
    try:
        import google.generativeai as genai
        
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        genai.configure(api_key=GEMINI_API_KEY)
        
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        lang_instruction = get_language_instruction(language)
        
        prompt = f"""
You are a forensic evidence analyzer for police complaints.

{lang_instruction}

Analyze this image as evidence in a police complaint.

User description (if any): {description}

Extract and provide:
1. Objects/items visible
2. Location clues
3. Suspicious activities
4. Recommendations for investigation

Return as JSON:
{{
  "extracted_info": "detailed observations",
  "suggestions": "investigation recommendations"
}}
"""
        
        # Send image + text to Gemini
        response = model.generate_content([
            prompt,
            {
                "mime_type": "image/jpeg",
                "data": image_base64
            }
        ])
        
        content = response.text
        
        # Parse JSON response
        try:
            if content.startswith("```"):
                content = content.replace("```json", "").replace("```", "").strip()
            result = json.loads(content)
            return {
                "extracted_info": result.get("extracted_info", ""),
                "suggestions": result.get("suggestions", "")
            }
        except:
            return {
                "extracted_info": content,
                "suggestions": "Review extracted information"
            }
            
    except Exception as e:
        print(f"Vision API Error: {e}")
        return {
            "extracted_info": f"Analysis error: {str(e)}",
            "suggestions": "Try a clearer image"
        }

# ✅ PDF GENERATION USING REPORTLAB
def generate_fir_pdf(fir_text: str, complainant_name: str = "", incident_date: str = "", 
                     incident_location: str = "", language: str = "en"):
    """
    Generate a professional FIR PDF using ReportLab
    """
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Preformatted
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from datetime import datetime
        import io
        
        # Sanitize fir_text - escape special HTML characters
        def escape_html(text):
            if not text:
                return ""
            text = str(text)
            text = text.replace("&", "&amp;")
            text = text.replace("<", "&lt;")
            text = text.replace(">", "&gt;")
            text = text.replace('"', "&quot;")
            text = text.replace("'", "&apos;")
            return text
        
        # Create PDF in memory
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=A4,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
            title="FIR Report"
        )
        
        styles = getSampleStyleSheet()
        elements = []
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=12,
            alignment=1,  # Center
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#374151'),
            spaceAfter=6,
            spaceBefore=12,
            fontName='Helvetica-Bold',
            borderColor=colors.HexColor('#E5E7EB'),
            borderPadding=8
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#1F2937'),
            alignment=4,  # Justified
            spaceAfter=8,
            leading=14
        )
        
        # FIR Header
        elements.append(Paragraph("FIRST INFORMATION REPORT (FIR)", title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Meta Information Table
        meta_data = [
            ["Field", "Details"],
            ["Report Date", datetime.now().strftime("%d-%m-%Y %H:%M")],
            ["Location", escape_html(incident_location or "Not Specified")],
            ["Complainant", escape_html(complainant_name or "Officer")],
            ["Incident Date", incident_date or datetime.now().strftime("%d-%m-%Y")],
        ]
        
        meta_table = Table(meta_data, colWidths=[1.5*inch, 4*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F3F4F6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#111827')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(meta_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # FIR Details Section
        elements.append(Paragraph("INCIDENT DESCRIPTION", heading_style))
        
        # Use sanitized text - replace newlines with <br/> for better formatting
        sanitized_fir_text = escape_html(fir_text)
        sanitized_fir_text = sanitized_fir_text.replace("\n", "<br/>")
        
        try:
            elements.append(Paragraph(sanitized_fir_text, body_style))
        except Exception as para_err:
            print(f"Paragraph rendering error: {para_err}, using Preformatted instead")
            # Fallback to preformatted text if Paragraph fails
            elements.append(Preformatted(escape_html(fir_text), body_style))
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Footer
        elements.append(Spacer(1, 0.5*inch))
        footer_table = Table([
            ["___________________", "", "___________________"],
            ["Officer Signature", "", "Date"]
        ], colWidths=[1.8*inch, 1*inch, 1.8*inch])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 0), (-1, -1), 40),
        ]))
        elements.append(footer_table)
        
        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        
        if pdf_buffer.getbuffer().nbytes == 0:
            raise ValueError("PDF buffer is empty after build")
        
        return pdf_buffer
        
    except Exception as e:
        print(f"PDF Generation Error: {e}")
        import traceback
        traceback.print_exc()
        raise