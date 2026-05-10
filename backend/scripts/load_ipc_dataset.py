import pandas as pd 
 
from sqlalchemy import text

from backend.db.database import SessionLocal
from backend.services.embedding import get_embedding

db = SessionLocal()

df = pd.read_csv("dataset/ipc_sections.csv")
import pandas as pd


def clean_text(value, fallback):

    if pd.isna(value):
        return fallback

    return (
        str(value)
        .replace("â€™", "'")
        .replace("â€œ", '"')
        .replace("â€", '"')
        .replace("\n", " ")
        .strip()
    )


for _, row in df.iterrows():

    ipc_section = clean_text(
        row["Section"],
        "Unknown IPC"
    )

    offense = clean_text(
        row["Offense"],
        "Relevant IPC offense"
    )

    description = clean_text(
        row["Description"],
        "IPC description unavailable"
    )

    punishment = clean_text(
        row["Punishment"],
        "Punishment not specified"
    )

    combined_text = f"""
    IPC Section: {ipc_section}

    Offense:
    {offense}

    Description:
    {description}

    Punishment:
    {punishment}
    """

    embedding = get_embedding(combined_text)

    db.execute(text("""

        INSERT INTO ipc_knowledge
        (
            ipc_section,
            offense,
            description,
            punishment,
            embedding
        )

        VALUES
        (
            :ipc_section,
            :offense,
            :description,
            :punishment,
            :embedding
        )

    """), {

        "ipc_section": ipc_section,
        "offense": offense,
        "description": description,
        "punishment": punishment,
        "embedding": str(embedding)
    }) 
    db.commit() 