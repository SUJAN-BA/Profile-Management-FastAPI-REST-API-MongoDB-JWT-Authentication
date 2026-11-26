import os
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from configrations import profiles_collection
from database.profile_models import ProfileInput
from routers.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])

COMPLETION_FIELDS = {
    "name": "Name",
    "phone_number": "Phone number",
    "date_of_birth": "Date of birth",
    "gender": "Gender",
    "is_jss_student": "JSS College answer",
    "hobbies": "Hobbies",
    "interests": "Interests",
    "address": "Permanent address",
    "branch": "Branch",
    "linkedin_url": "LinkedIn URL",
    "github_url": "GitHub URL",
    "profile_picture_url": "Profile picture",
}


def has_value(profile: dict, field: str) -> bool:
    if field == "is_jss_student":
        return isinstance(profile.get(field), bool)
    value = profile.get(field)
    if isinstance(value, list):
        return len(value) > 0
    return value is not None and str(value).strip() != ""


def serialize_profile(profile: dict) -> dict:
    profile["id"] = str(profile.pop("_id"))
    profile["user_id"] = str(profile["user_id"])
    if isinstance(profile.get("date_of_birth"), (datetime,)):
        profile["date_of_birth"] = profile["date_of_birth"].isoformat()
    return profile


def get_completion(profile: dict | None) -> dict:
    if profile is None:
        missing = list(COMPLETION_FIELDS.values())
        return {"percentage": 0, "missing_fields": missing}

    missing = [
        label
        for field, label in COMPLETION_FIELDS.items()
        if not has_value(profile, field)
    ]
    completed = len(COMPLETION_FIELDS) - len(missing)
    percentage = round(completed * 100 / len(COMPLETION_FIELDS))
    return {"percentage": percentage, "missing_fields": missing}


def configure_cloudinary():
    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError as error:
        raise HTTPException(
            status_code=503,
            detail="Profile picture uploads are not configured",
        ) from error

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    if not all([cloud_name, api_key, api_secret]):
        raise HTTPException(
            status_code=503,
            detail="Cloudinary credentials are not configured",
        )
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
    return cloudinary


@router.get("/")
async def get_profile(current_user: dict = Depends(get_current_user)):
    profile = profiles_collection.find_one(
        {"user_id": ObjectId(current_user["id"])}
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile has not been created")

    result = serialize_profile(profile)
    result["completion"] = get_completion(profile)
    return result


@router.get("/completion")
async def get_profile_completion(current_user: dict = Depends(get_current_user)):
    profile = profiles_collection.find_one(
        {"user_id": ObjectId(current_user["id"])}
    )
    return get_completion(profile)


@router.put("/")
async def save_profile(
    profile: ProfileInput,
    current_user: dict = Depends(get_current_user),
):
    user_id = ObjectId(current_user["id"])
    profile_data = profile.model_dump(mode="json")
    profile_data["updated_at"] = datetime.now(timezone.utc)

    profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": profile_data, "$setOnInsert": {"user_id": user_id}},
        upsert=True,
    )
    saved_profile = profiles_collection.find_one({"user_id": user_id})
    if saved_profile is None:
        raise HTTPException(status_code=500, detail="Profile could not be saved")

    result = serialize_profile(saved_profile)
    result["completion"] = get_completion(saved_profile)
    return result


@router.post("/picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG, PNG, or WebP image",
        )
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Profile picture must be 5 MB or smaller",
        )

    user_id = ObjectId(current_user["id"])
    existing_profile = profiles_collection.find_one({"user_id": user_id})
    if existing_profile is None:
        raise HTTPException(
            status_code=404,
            detail="Create your profile before uploading a profile picture",
        )

    cloudinary = configure_cloudinary()
    public_id = f"profile_pictures/user_{current_user['id']}"
    try:
        upload = cloudinary.uploader.upload(
            file.file,
            public_id=public_id,
            overwrite=True,
            invalidate=True,
            resource_type="image",
        )
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="Cloudinary could not upload the profile picture",
        ) from error

    profiles_collection.update_one(
        {"user_id": ObjectId(current_user["id"])},
        {
            "$set": {
                "profile_picture_url": upload["secure_url"],
                "profile_picture_public_id": upload["public_id"],
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return {
        "profile_picture_url": upload["secure_url"],
        "message": "Profile picture uploaded successfully",
    }


@router.delete("/picture")
async def delete_profile_picture(current_user: dict = Depends(get_current_user)):
    user_id = ObjectId(current_user["id"])
    profile = profiles_collection.find_one({"user_id": user_id})
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile has not been created")

    public_id = profile.get("profile_picture_public_id")
    if public_id:
        cloudinary = configure_cloudinary()
        try:
            cloudinary.uploader.destroy(public_id, invalidate=True)
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail="Cloudinary could not delete the profile picture",
            ) from error

    profiles_collection.update_one(
        {"user_id": user_id},
        {
            "$unset": {
                "profile_picture_url": "",
                "profile_picture_public_id": "",
            }
        },
    )
    return {"message": "Profile picture deleted successfully"}
