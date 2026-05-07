from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://postgres:Rutupatil#23@localhost/FIR_sahayak"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autoflush=False, bind = engine)
Base = declarative_base()
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
