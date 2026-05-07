from pydantic import BaseModel
from datetime import date
from typing import Optional

class StationCreate(BaseModel):
    station_name: str
    location: str
    contact_number: str

class StationResponse(BaseModel):
    station_id: int
    station_name: str
    location: str
    contact_number: str

    class Config:
        from_attributes = True

class OfficerCreate(BaseModel):
    name: str
    email: str
    password: str
    rank: str
    station_id: int

class OfficerLogin(BaseModel):
    email: str
    password: str

class OfficerResponse(BaseModel):
    officer_id: int
    name: str
    email: str
    rank: str
    station_id: int

    class Config:
        from_attributes = True

class FIRCreate(BaseModel): 
    officer_id: int 
    incident_location: str 
    crime_type: str
    description: str
    date: date
    status: str
    
class EvidenceCreate(BaseModel): 
    fir_id: int 
    evidence_type: str 
    file_path: str
    description: str


class FIRResponse(BaseModel):
    fir_id: int
    incident_location: str
    crime_type: str
    description: str
    date: date
    status: str

    class Config:
        from_attributes = True

class SearchRequest(BaseModel):
    text_input: str
    
class AIRequest(BaseModel):
    description: str
    language: str = "en"
    complainant_name: Optional[str] = None
    complainant_address: Optional[str] = None
    complainant_contact: Optional[str] = None
    station_name: Optional[str] = None

class ImageAnalysisRequest(BaseModel):
    description: Optional[str] = None
    language: str = "en"

class ImageAnalysisResponse(BaseModel):
    extracted_info: str
    suggestions: str

class PDFDownloadRequest(BaseModel):
    fir_text: str
    complainant_name: Optional[str] = None
    incident_date: Optional[str] = None
    incident_location: Optional[str] = None