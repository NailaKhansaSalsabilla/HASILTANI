from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    model_dir: Path = Path(os.getenv("MODEL_DIR", "./models")).resolve()
    allow_demo_fallback: bool = os.getenv("ALLOW_DEMO_FALLBACK", "true").lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


settings = Settings()
