import os
from pathlib import Path

import requests
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)

GNANI_API_KEY = os.getenv("GNANI_API_KEY", "").strip()
GNANI_TTS_URL = "https://api.vachana.ai/api/v1/tts/inference"

SUPPORTED_LANGUAGES = {
    "mr-IN", "hi-IN", "en-IN"
}


class GnaniTTSError(Exception):
    """Raised when Gnani text-to-speech fails."""


def synthesize_speech(
    text: str,
    language: str = "mr-IN",
) -> bytes:
    if not GNANI_API_KEY:
        raise GnaniTTSError(
            "GNANI_API_KEY is missing from backend/.env"
        )

    text = text.strip()

    if not text:
        raise GnaniTTSError("Text cannot be empty.")

    if len(text) > 4000:
        raise GnaniTTSError(
            "Text is too long. Please use a text of 4000 characters or less."
        )

    if language not in SUPPORTED_LANGUAGES:
        raise GnaniTTSError(
            "Unsupported language. Choose mr-IN, hi-IN, or en-IN."
        )

    payload = {
        "text": text,
        "model": "timbre-v3.0",
        "voice": "Shivani",
        "language": language,
        "speed": 1.0,
        "audio_config": {
            "encoding": "linear_pcm",
            "container": "wav",
            "num_channels": 1,
            "sample_rate": 24000,
            "sample_width": 2,
        },
    }

    headers = {
        "X-API-Key-ID": GNANI_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            GNANI_TTS_URL,
            headers=headers,
            json=payload,
            timeout=120,
        )
    except requests.RequestException as exc:
        raise GnaniTTSError(
            f"Could not connect to Gnani TTS: {exc}"
        ) from exc

    if not response.ok:
        try:
            error_data = response.json()
            error_message = (
                error_data.get("message")
                or error_data.get("detail", {}).get("message")
                or "Unknown Gnani TTS error"
            )
        except (ValueError, AttributeError):
            error_message = response.text[:500]

        raise GnaniTTSError(
            f"Gnani TTS returned HTTP {response.status_code}: "
            f"{error_message}"
        )

    if not response.content:
        raise GnaniTTSError("Gnani returned an empty audio response.")

    return response.content