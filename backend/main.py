import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import IS_POSTGRES, init_db
from routes import auth, orgs, posts, replies, users

app = FastAPI(title="ADME API")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(replies.router)
app.include_router(orgs.router)
app.include_router(users.router)

init_db()


@app.get("/api/health")
def health():
    database = "sqlite (local)"
    if IS_POSTGRES:
        database = "postgres (supabase)"
    return {"ok": True, "database": database}
