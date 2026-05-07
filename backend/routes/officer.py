from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models.models import PoliceOfficer
from backend.schemas.schemas import OfficerCreate, OfficerLogin, OfficerResponse

router = APIRouter(prefix="/officer")


@router.post("/", response_model=OfficerResponse)
def create_officer(officer: OfficerCreate, db: Session = Depends(get_db)):
    existing = db.query(PoliceOfficer).filter(PoliceOfficer.email == officer.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Officer with this email already exists")
    new_officer = PoliceOfficer(**officer.model_dump())
    db.add(new_officer)
    db.commit()
    db.refresh(new_officer)
    return new_officer


@router.post("/login", response_model=OfficerResponse)
def login_officer(credentials: OfficerLogin, db: Session = Depends(get_db)):
    officer = db.query(PoliceOfficer).filter(
        PoliceOfficer.email == credentials.email,
        PoliceOfficer.password == credentials.password
    ).first()
    if not officer:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return officer
