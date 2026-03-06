# python
import logging

# 3rd party
import numpy as np
from faster_whisper import WhisperModel

# local
from core.config import settings


logger = logging.getLogger(__name__)

_model: WhisperModel | None = None


def get_whisper_model() -> WhisperModel:
    """Lazy-load and cache the Whisper model singleton."""

    global _model
    if _model is None:
        logger.info(
            "Loading faster-whisper model: size=%s, device=%s, compute_type=%s",
            settings.WHISPER_MODEL_SIZE,
            settings.WHISPER_DEVICE,
            settings.WHISPER_COMPUTE_TYPE,
        )
        _model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE,
        )
        logger.info("Whisper model loaded successfully.")
        
    return _model


def transcribe_audio(audio_data: np.ndarray, language: str = "en") -> str:
    """
    Transcribe audio data using faster-whisper.

    Args:
        audio_data: numpy array of float32 audio samples (16 kHz mono).
        language: language code for transcription.

    Returns:
        Transcribed text string.
    """
    model = get_whisper_model()

    if len(audio_data) == 0:
        return ""

    # Normalise audio to float32 range [-1, 1].
    audio_float = audio_data.astype(np.float32)
    max_val = np.max(np.abs(audio_float))
    if max_val > 0:
        audio_float = audio_float / max_val

    segments, info = model.transcribe(
        audio_float,
        language=language,
        beam_size=1,
        best_of=1,
        vad_filter=True,
        vad_parameters=dict(
            min_silence_duration_ms=300,
            speech_pad_ms=200,
        ),
    )

    text_parts: list[str] = []
    for segment in segments:
        text_parts.append(segment.text.strip())

    return " ".join(text_parts)
