from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models.models import PoliceStation
from backend.schemas.schemas import StationCreate, StationResponse

router = APIRouter(prefix="/station")


@router.post("/", response_model=StationResponse)
def create_station(station: StationCreate, db: Session = Depends(get_db)):
    new_station = PoliceStation(**station.model_dump())
    db.add(new_station)
    db.commit()
    db.refresh(new_station)
    return new_station


@router.get("/by-name", response_model=StationResponse)
def get_station_by_name(name: str, db: Session = Depends(get_db)):
    station = db.query(PoliceStation).filter(
        PoliceStation.station_name.ilike(name)
    ).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station
