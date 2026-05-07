from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db.database import engine, Base
from backend.routes import station, officer, fir, ai
from pydantic import BaseModel

app = FastAPI()

# ✅ CORS MUST BE HERE (immediately after app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(station.router)
app.include_router(officer.router)
app.include_router(fir.router)
app.include_router(ai.router)

@app.get("/")
def home():
    return {"message": "FIR Sahayak API Running"}