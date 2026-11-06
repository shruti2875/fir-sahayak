from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from backend.services.gnani import (
    transcribe_audio,
    GnaniSTTError,
)

from pydantic import BaseModel, Field
from fastapi.responses import Response

from backend.services.gnani_tts import (
    synthesize_speech,
    GnaniTTSError,
)

router = APIRouter(prefix="/voice", tags=["Voice AI"])


@router.post("/transcribe")
async def transcribe_complaint(
    audio: UploadFile = File(...),
    language_code: str = Form("mr-IN"),
):
    try:
        audio_bytes = await audio.read()

        # Basic upload-size protection: 15 MB.
        if len(audio_bytes) > 15 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Audio file is too large. Maximum size is 15 MB.",
            )

        result = transcribe_audio(
            audio_bytes=audio_bytes,
            filename=audio.filename or "recording.wav",
            language_code=language_code,
        )

        return {
            "success": True,
            **result,
        }

    except GnaniSTTError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    finally:
        await audio.close()
        
      
        

class SpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    language_code: str = "mr-IN"


@router.post("/speak")
def speak_fir(request: SpeechRequest):
    try:
        audio_bytes = synthesize_speech(
            text=request.text,
            language=request.language_code,
        )

        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": 'inline; filename="fir_audio.wav"'
            },
        )

    except GnaniTTSError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc