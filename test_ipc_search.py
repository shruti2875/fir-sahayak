
from backend.db.database import SessionLocal
from backend.services.ipc import retrieve_ipc_sections

db = SessionLocal()

try:
    query = "Someone stole my mobile phone from my bag."

    results = retrieve_ipc_sections(db, query)

    print("\nSemantic IPC Search Results:\n")

    for result in results:
        print("Section:", result["ipc_section"])
        print("Offense:", result["offense"])
        print("Distance:", result["score"])
        print("-" * 50)

finally:
    db.close()
