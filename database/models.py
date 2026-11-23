from datetime import datetime, timezone

from pydantic import BaseModel, Field


class Todo(BaseModel):
    title: str
    description: str
    is_completed: bool = False
    is_deleted: bool = False
    updated_at: int = Field(
        default_factory=lambda: int(datetime.now(timezone.utc).timestamp())
    )
    creation: int = Field(
        default_factory=lambda: int(datetime.now(timezone.utc).timestamp())
    )