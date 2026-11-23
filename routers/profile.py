from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from configrations import profiles_collection
from database.profile_models import ProfileInput
from routers.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/")
async def get_profile(current_user: dict = Depends(get_current_user)):
    profile = profiles_collection.find_one(
        {"user_id": ObjectId(current_user["id"])}
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile has not been created")

    profile["id"] = str(profile.pop("_id"))
    profile["user_id"] = str(profile["user_id"])
    return profile


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

    saved_profile["id"] = str(saved_profile.pop("_id"))
    saved_profile["user_id"] = str(saved_profile["user_id"])
    return saved_profile
