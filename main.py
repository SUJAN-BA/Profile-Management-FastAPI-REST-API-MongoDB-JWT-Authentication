from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, FastAPI, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from configrations import (
    client,
    collection,
    profiles_collection,
    revoked_tokens_collection,
    users_collection,
)
from database.models import Todo
from database.schemas import all_tasks
from routers.auth import router as auth_router
from routers.profile import router as profile_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    users_collection.create_index("email", unique=True)
    profiles_collection.create_index("user_id", unique=True)
    revoked_tokens_collection.create_index("expires_at", expireAfterSeconds=0)
    yield
    client.close()


app = FastAPI(title="Authentication and Profile Management API", lifespan=lifespan)
frontend_directory = Path(__file__).parent / "frontend"
app.mount(
    "/static",
    StaticFiles(directory=str(frontend_directory)),
    name="static",
)
todo_router = APIRouter(prefix="/api/todos", tags=["todos"])


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse("/login")


@app.get("/login", include_in_schema=False)
async def login_page():
    return FileResponse(frontend_directory / "login.html")


@app.get("/register", include_in_schema=False)
async def register_page():
    return FileResponse(frontend_directory / "register.html")


@app.get("/home", include_in_schema=False)
async def home_page():
    return FileResponse(frontend_directory / "home.html")


@app.get("/profile", include_in_schema=False)
async def profile_page():
    return FileResponse(frontend_directory / "profile.html")


@todo_router.get("/")
async def get_all_todos():
    return all_tasks(collection.find({"is_deleted": False}))


@todo_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_task(new_task: Todo):
    result = collection.insert_one(new_task.model_dump())
    return {"id": str(result.inserted_id)}


@todo_router.put("/{task_id}")
async def update_task(task_id: str, updated_task: Todo):
    try:
        object_id = ObjectId(task_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid task ID")

    existing_task = collection.find_one(
        {"_id": object_id, "is_deleted": False}
    )
    if existing_task is None:
        raise HTTPException(status_code=404, detail="Task does not exist")

    task_data = updated_task.model_dump()
    task_data["creation"] = existing_task["creation"]
    task_data["updated_at"] = int(datetime.now(timezone.utc).timestamp())
    collection.update_one({"_id": object_id}, {"$set": task_data})
    return {"message": "Task updated successfully"}


@todo_router.delete("/{task_id}")
async def delete_task(task_id: str):
    try:
        object_id = ObjectId(task_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid task ID")

    result = collection.update_one(
        {"_id": object_id, "is_deleted": False},
        {"$set": {"is_deleted": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task does not exist")
    return {"message": "Task deleted successfully"}


app.include_router(todo_router)
app.include_router(auth_router)
app.include_router(profile_router)
