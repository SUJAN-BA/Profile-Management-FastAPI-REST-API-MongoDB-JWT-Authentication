import os

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

mongodb_uri = os.getenv("MONGODB_URI")
if not mongodb_uri:
    raise RuntimeError("MONGODB_URI is not set. Add it to your local .env file.")

client = MongoClient(
    mongodb_uri,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000,
)
db = client["todo_db"]

collection = db["todo_data"]
users_collection = db["users"]
profiles_collection = db["profiles"]
revoked_tokens_collection = db["revoked_tokens"]
