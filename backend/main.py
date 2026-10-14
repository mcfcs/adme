import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import db
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

database_error = None


def setup_database():
    global database_error
    if db.CONFIG_ERROR is not None:
        database_error = db.CONFIG_ERROR
        return
    try:
        init_db()
        database_error = None
    except Exception as error:
        database_error = "Can't connect to the database: " + str(error).strip().splitlines()[0]
    if database_error is not None:
        print("[db]", database_error)


setup_database()


@app.middleware("http")
async def require_database(request: Request, call_next):
    if database_error is not None and request.url.path != "/api/health":
        setup_database()
    if database_error is not None and request.url.path != "/api/health":
        return JSONResponse(status_code=503, content={"detail": database_error})
    return await call_next(request)


@app.get("/api/health")
def health():
    database = "sqlite (local)"
    if IS_POSTGRES:
        database = "postgres (supabase)"
    if database_error is not None:
        return {"ok": False, "database": database, "error": database_error}
    return {"ok": True, "database": database}
