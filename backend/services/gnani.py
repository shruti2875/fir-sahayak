import os
from pathlib import Path

import requests
from dotenv import load_dotenv

# Load backend/.env regardless of the terminal's working directory.
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)

GNANI_API_KEY = os.getenv("GNANI_API_KEY", "").strip()
GNANI_STT_URL = "https://api.vachana.ai/stt/v3"


class GnaniSTTError(Exception):
    """Raised when Gnani speech-to-text fails."""


def transcribe_audio(
    audio_bytes: bytes,
    filename: str,
    language_code: str = "mr-IN",
) -> dict:
    if not GNANI_API_KEY:
        raise GnaniSTTError(
            "GNANI_API_KEY is missing from backend/.env"
        )

    if not audio_bytes:
        raise GnaniSTTError("The uploaded audio file is empty.")

    allowed_extensions = {
        ".wav", ".mp3", ".ogg", ".flac", ".aac", ".m4a"
    }
    extension = Path(filename).suffix.lower()

    if extension not in allowed_extensions:
        raise GnaniSTTError(
            "Unsupported audio format. Use WAV, MP3, OGG, FLAC, AAC, or M4A."
        )

    supported_languages = {"mr-IN", "hi-IN", "en-IN"}
    if language_code not in supported_languages:
        raise GnaniSTTError(
            "Unsupported language. Choose mr-IN, hi-IN, or en-IN."
        )

    headers = {
        "X-API-Key-ID": GNANI_API_KEY,
    }

    data = {
        "model": "prisma-v3.0",
        "language_code": language_code,
        "format": "transcribe",
        "topic": "Police complaint and FIR statement",
        "keyterms": '["FIR", "police station", "complaint", "incident"]',
    }

    files = {
        "audio_file": (
            filename,
            audio_bytes,
            "application/octet-stream",
        )
    }

    try:
        response = requests.post(
            GNANI_STT_URL,
            headers=headers,
            data=data,
            files=files,
            timeout=90,
        )
    except requests.RequestException as exc:
        raise GnaniSTTError(
            f"Could not connect to Gnani STT: {exc}"
        ) from exc

    if not response.ok:
        # Do not include request headers or API key in error messages.
        try:
            error_data = response.json()
            error_message = (
                error_data.get("message")
                or error_data.get("detail")
                or error_data.get("error")
                or "Unknown Gnani API error"
            )
        except ValueError:
            error_message = response.text[:500]

        raise GnaniSTTError(
            f"Gnani STT returned HTTP {response.status_code}: "
            f"{error_message}"
        )

    try:
        result = response.json()
    except ValueError as exc:
        raise GnaniSTTError(
            "Gnani returned an invalid JSON response."
        ) from exc

    transcript = result.get("transcript", "").strip()

    if result.get("success") is False or not transcript:
        raise GnaniSTTError(
            result.get("message", "No speech could be transcribed.")
        )

    return {
        "transcript": transcript,
        "model": result.get("model", "prisma-v3.0"),
        "detected_language_code": result.get(
            "detected_language_code"
        ),
        "request_id": result.get("request_id"),
        "processing_time": result.get("processing_time"),
    }