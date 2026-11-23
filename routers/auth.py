import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from pymongo.errors import DuplicateKeyError

from configrations import revoked_tokens_collection, users_collection
from database.auth_models import LoginRequest, RegisterRequest

router = APIRouter(prefix="/api/auth", tags=["authentication"])

secret_key = os.getenv("JWT_SECRET_KEY")
if not secret_key:
    raise RuntimeError("JWT_SECRET_KEY is not set. Add it to your local .env file.")
if len(secret_key.encode("utf-8")) < 32:
    raise RuntimeError("JWT_SECRET_KEY must contain at least 32 bytes.")

jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
if jwt_algorithm != "HS256":
    raise RuntimeError("JWT_ALGORITHM must be HS256.")

try:
    access_token_expire_minutes = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )
except ValueError as error:
    raise RuntimeError(
        "ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer."
    ) from error
if access_token_expire_minutes < 1:
    raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer.")

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=access_token_expire_minutes
    )
    return jwt.encode(
        {"sub": user_id, "jti": uuid4().hex, "exp": expires_at},
        secret_key,
        algorithm=jwt_algorithm,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            secret_key,
            algorithms=[jwt_algorithm],
        )
        user_id = payload.get("sub")
        token_id = payload.get("jti")
        expires_at = payload.get("exp")
        if (
            not isinstance(user_id, str)
            or not isinstance(token_id, str)
            or not isinstance(expires_at, (int, float))
        ):
            raise unauthorized
        object_id = ObjectId(user_id)
    except (jwt.InvalidTokenError, InvalidId) as error:
        raise unauthorized from error

    if revoked_tokens_collection.find_one({"jti": token_id}) is not None:
        raise unauthorized
    user = users_collection.find_one({"_id": object_id})
    if user is None:
        raise unauthorized

    return {
        "id": user_id,
        "email": user["email"],
        "jti": token_id,
        "expires_at": datetime.fromtimestamp(expires_at, timezone.utc),
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    email = str(request.email).lower()
    user = {
        "email": email,
        "password": password_hash.hash(request.password),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = users_collection.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    return {"id": str(result.inserted_id), "email": email}


@router.post("/login")
async def login(request: LoginRequest):
    email = str(request.email).lower()
    user = users_collection.find_one({"email": email})
    if user is None or not password_hash.verify(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": create_access_token(str(user["_id"])),
        "token_type": "bearer",
        "expires_in": access_token_expire_minutes * 60,
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["id"], "email": current_user["email"]}


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    revoked_tokens_collection.insert_one(
        {
            "jti": current_user["jti"],
            "expires_at": current_user["expires_at"],
        }
    )
    return {"message": "Logged out successfully"}
