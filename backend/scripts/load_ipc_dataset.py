
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import text

# Ensure project root is available for backend imports
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import SessionLocal
from backend.services.embedding import get_embedding


DATASET_PATH = PROJECT_ROOT / "dataset" / "ipc_sections.csv"
BATCH_SIZE = 50


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


def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)

    required_columns = {"Section", "Offense", "Description", "Punishment"}
    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(f"Missing CSV columns: {missing}")

    print(f"Dataset loaded: {len(df)} records")

    db = SessionLocal()
    batch = []
    inserted_or_updated = 0

    try:
        for index, row in df.iterrows():
            ipc_section = clean_text(row["Section"], "Unknown IPC")
            offense = clean_text(row["Offense"], "Relevant IPC offense")
            description = clean_text(
                row["Description"], "IPC description unavailable"
            )
            punishment = clean_text(
                row["Punishment"], "Punishment not specified"
            )

            combined_text = (
                f"IPC Section: {ipc_section}\n"
                f"Offense: {offense}\n"
                f"Description: {description}\n"
                f"Punishment: {punishment}"
            )

            embedding = get_embedding(combined_text)

            if len(embedding) != 384:
                raise ValueError(
                    f"Expected 384 dimensions, got {len(embedding)} "
                    f"for {ipc_section}"
                )

            batch.append({
                "ipc_section": ipc_section,
                "offense": offense,
                "description": description,
                "punishment": punishment,
                "embedding": str(embedding)
            })

            if len(batch) >= BATCH_SIZE:
                save_batch(db, batch)
                inserted_or_updated += len(batch)
                print(
                    f"Processed {inserted_or_updated}/{len(df)} records"
                )
                batch.clear()

        if batch:
            save_batch(db, batch)
            inserted_or_updated += len(batch)

        print("\nDataset loading completed!")
        print(f"Records processed: {inserted_or_updated}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def save_batch(db, records):
    db.execute(
        text("""
            INSERT INTO ipc_knowledge
                (ipc_section, offense, description, punishment, embedding)
            VALUES
                (:ipc_section, :offense, :description, :punishment,
                 CAST(:embedding AS vector))
            ON CONFLICT (ipc_section)
            DO UPDATE SET
                offense = EXCLUDED.offense,
                description = EXCLUDED.description,
                punishment = EXCLUDED.punishment,
                embedding = EXCLUDED.embedding
        """),
        records
    )
    db.commit()


if __name__ == "__main__":
    main()
