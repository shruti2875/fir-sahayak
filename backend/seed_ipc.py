"""
Run this once to seed the ipc_knowledge table:
  python backend/seed_ipc.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.db.database import engine
from backend.services.embedding import get_embedding
from sqlalchemy import text

IPC_DATA = [
    ("IPC 379", "Theft", "Whoever commits theft shall be punished.", "Imprisonment up to 3 years, or fine, or both."),
    ("IPC 380", "Theft in dwelling house", "Theft in a building used as a human dwelling.", "Imprisonment up to 7 years and fine."),
    ("IPC 381", "Theft by clerk or servant", "Theft by a clerk or servant of property in possession of master.", "Imprisonment up to 7 years and fine."),
    ("IPC 382", "Theft after preparation for causing death or hurt", "Theft after preparation made for causing death or hurt to any person.", "Imprisonment up to 10 years and fine."),
    ("IPC 390", "Robbery", "Theft or extortion with use of force or threat of force.", "Imprisonment up to 10 years and fine."),
    ("IPC 392", "Punishment for robbery", "Whoever commits robbery shall be punished.", "Imprisonment up to 10 years and fine; up to 14 years if on highway."),
    ("IPC 394", "Voluntarily causing hurt in committing robbery", "Causing hurt while committing or attempting robbery.", "Imprisonment for life or up to 10 years and fine."),
    ("IPC 395", "Dacoity", "Robbery committed by five or more persons.", "Imprisonment for life or up to 10 years and fine."),
    ("IPC 420", "Cheating and dishonestly inducing delivery of property", "Cheating and thereby dishonestly inducing the person deceived to deliver any property.", "Imprisonment up to 7 years and fine."),
    ("IPC 406", "Criminal breach of trust", "Punishment for criminal breach of trust.", "Imprisonment up to 3 years, or fine, or both."),
    ("IPC 409", "Criminal breach of trust by public servant", "Criminal breach of trust by a public servant, banker, merchant or agent.", "Imprisonment for life or up to 10 years and fine."),
    ("IPC 411", "Dishonestly receiving stolen property", "Dishonestly receiving or retaining stolen property.", "Imprisonment up to 3 years, or fine, or both."),
    ("IPC 413", "Habitually dealing in stolen property", "Habitually receiving or dealing in stolen property.", "Imprisonment for life or up to 10 years and fine."),
    ("IPC 323", "Voluntarily causing hurt", "Whoever voluntarily causes hurt to any person.", "Imprisonment up to 1 year, or fine up to Rs 1000, or both."),
    ("IPC 324", "Voluntarily causing hurt by dangerous weapons", "Causing hurt by means of any instrument for shooting, stabbing or cutting.", "Imprisonment up to 3 years, or fine, or both."),
    ("IPC 325", "Voluntarily causing grievous hurt", "Whoever voluntarily causes grievous hurt.", "Imprisonment up to 7 years and fine."),
    ("IPC 326", "Voluntarily causing grievous hurt by dangerous weapons", "Causing grievous hurt by dangerous weapons or means.", "Imprisonment for life or up to 10 years and fine."),
    ("IPC 354", "Assault or criminal force to woman with intent to outrage modesty", "Assault or use of criminal force to any woman intending to outrage her modesty.", "Imprisonment up to 2 years, or fine, or both."),
    ("IPC 376", "Punishment for rape", "Whoever commits rape shall be punished.", "Imprisonment not less than 7 years, may extend to life imprisonment and fine."),
    ("IPC 498A", "Husband or relative of husband of a woman subjecting her to cruelty", "Cruelty by husband or his relatives towards wife.", "Imprisonment up to 3 years and fine."),
    ("IPC 302", "Punishment for murder", "Whoever commits murder shall be punished.", "Death or imprisonment for life and fine."),
    ("IPC 304", "Punishment for culpable homicide not amounting to murder", "Culpable homicide not amounting to murder.", "Imprisonment for life or up to 10 years and fine."),
    ("IPC 307", "Attempt to murder", "Whoever does any act with intention or knowledge to cause death.", "Imprisonment up to 10 years and fine; if hurt caused, imprisonment for life."),
    ("IPC 341", "Punishment for wrongful restraint", "Whoever wrongfully restrains any person.", "Imprisonment up to 1 month, or fine up to Rs 500, or both."),
    ("IPC 342", "Punishment for wrongful confinement", "Whoever wrongfully confines any person.", "Imprisonment up to 1 year, or fine up to Rs 1000, or both."),
    ("IPC 427", "Mischief causing damage", "Mischief causing damage to the amount of fifty rupees or upwards.", "Imprisonment up to 2 years, or fine, or both."),
    ("IPC 436", "Mischief by fire or explosive substance", "Mischief by fire or explosive substance with intent to destroy house.", "Imprisonment for life or up to 10 years and fine."),
    ("IPC 447", "Punishment for criminal trespass", "Whoever commits criminal trespass.", "Imprisonment up to 3 months, or fine up to Rs 500, or both."),
    ("IPC 448", "Punishment for house-trespass", "Whoever commits house-trespass.", "Imprisonment up to 1 year, or fine up to Rs 1000, or both."),
    ("IPC 465", "Punishment for forgery", "Whoever commits forgery.", "Imprisonment up to 2 years, or fine, or both."),
    ("IPC 468", "Forgery for purpose of cheating", "Forgery for the purpose of cheating.", "Imprisonment up to 7 years and fine."),
    ("IPC 471", "Using as genuine a forged document", "Whoever fraudulently or dishonestly uses as genuine any forged document.", "Imprisonment up to 2 years, or fine, or both."),
    ("IPC 500", "Punishment for defamation", "Whoever defames another shall be punished.", "Imprisonment up to 2 years, or fine, or both."),
    ("IPC 506", "Punishment for criminal intimidation", "Whoever commits criminal intimidation.", "Imprisonment up to 2 years, or fine, or both; up to 7 years if threat of death."),
    ("IPC 509", "Word, gesture or act intended to insult the modesty of a woman", "Uttering any word or making any gesture intended to insult the modesty of a woman.", "Imprisonment up to 3 years and fine."),
]

def seed():
    conn = engine.connect()
    inserted = 0
    for ipc_section, offense, description, punishment in IPC_DATA:
        # Skip if already exists
        existing = conn.execute(
            text("SELECT 1 FROM ipc_knowledge WHERE ipc_section = :s"),
            {"s": ipc_section}
        ).fetchone()
        if existing:
            continue

        emb = get_embedding(f"{offense} {description}")
        conn.execute(text("""
            INSERT INTO ipc_knowledge (ipc_section, offense, description, punishment, embedding)
            VALUES (:ipc_section, :offense, :description, :punishment, CAST(:embedding AS vector))
        """), {
            "ipc_section": ipc_section,
            "offense": offense,
            "description": description,
            "punishment": punishment,
            "embedding": str(emb)
        })
        inserted += 1
        print(f"  Inserted {ipc_section}")

    conn.commit()
    conn.close()
    print(f"\nDone. Inserted {inserted} IPC sections.")

if __name__ == "__main__":
    seed()
