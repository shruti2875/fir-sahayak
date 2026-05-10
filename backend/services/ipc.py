from sqlalchemy import text

from backend.services.embedding import get_embedding


def retrieve_ipc_sections(db, complaint: str):

    embedding = get_embedding(complaint)

    rows = db.execute(text("""

        SELECT
            ipc_section,
            offense,
            description,
            punishment,

            embedding <-> CAST(:embedding AS vector)
            AS distance

        FROM ipc_knowledge

        ORDER BY distance

        LIMIT 5

    """), {
        "embedding": str(embedding)
    }).fetchall()

    return [

        {
            "ipc_section": row[0],
            "offense": row[1],
            "description": row[2],
            "punishment": row[3],
            "score": round(float(row[4]), 2)
        }

        for row in rows
    ]