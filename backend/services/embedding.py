import hashlib
import os

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
USE_OFFLINE_FALLBACK = os.getenv("EMBEDDING_OFFLINE_FALLBACK", "1").lower() in ("1", "true", "yes", "on")

_model = None


def _load_embedding_model():
    global _model
    if _model is not None:
        return _model

    try:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        return _model

    except Exception as exc:
        print(f"WARNING: Could not load embedding model '{EMBEDDING_MODEL_NAME}': {exc}")
        if USE_OFFLINE_FALLBACK:
            print("Using deterministic offline fallback embeddings.")
            return None
        raise


def _offline_embedding(text: str):
    digest = hashlib.blake2b(text.encode("utf-8"), digest_size=384 * 2).digest()
    return [((digest[i] << 8) | digest[i + 1]) / 65535.0 for i in range(0, len(digest), 2)]


def get_embedding(text: str):
    model = _load_embedding_model()
    if model is not None:
        try:
            return model.encode(text).tolist()
        except Exception as exc:
            print(f"WARNING: Embedding model encode failed, falling back to offline embeddings: {exc}")

    return _offline_embedding(text)














