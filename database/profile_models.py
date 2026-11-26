import re
from datetime import date, datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator


class ProfileInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone_number: str = Field(min_length=7, max_length=20)
    date_of_birth: date
    gender: Literal["male", "female", "non_binary", "other", "prefer_not_to_say"]
    is_jss_student: bool
    hobbies: list[Literal["Reading", "Sports", "Music", "Travelling"]] = Field(
        default_factory=list
    )
    interests: list[
        Literal["Technology", "Programming", "Business", "Data Science"]
    ] = Field(default_factory=list)
    address: str = Field(min_length=1, max_length=2000)
    branch: Literal["ISE", "CSE", "ECE", "MECH"]
    linkedin_url: HttpUrl | None = None
    github_url: HttpUrl | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Name must not be blank")
        return normalized

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        normalized = value.strip()
        if (
            re.fullmatch(r"\+?[0-9][0-9\s().-]{5,18}", normalized) is None
            or not 7 <= sum(character.isdigit() for character in normalized) <= 15
        ):
            raise ValueError("Enter a valid phone number")
        return normalized

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, value: date) -> date:
        if value > datetime.now(timezone.utc).date():
            raise ValueError("Date of birth cannot be in the future")
        return value

    @field_validator("linkedin_url")
    @classmethod
    def validate_linkedin_url(cls, value: HttpUrl | None) -> HttpUrl | None:
        if value is not None:
            host = (value.host or "").lower()
            if host != "linkedin.com" and not host.endswith(".linkedin.com"):
                raise ValueError("LinkedIn URL must use linkedin.com")
        return value

    @field_validator("github_url")
    @classmethod
    def validate_github_url(cls, value: HttpUrl | None) -> HttpUrl | None:
        if value is not None:
            host = (value.host or "").lower()
            if host != "github.com" and not host.endswith(".github.com"):
                raise ValueError("GitHub URL must use github.com")
        return value
