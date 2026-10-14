import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from db import execute, new_id, now_iso, query_one
from security import create_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

USERNAME_PATTERN = re.compile(r"^[a-z0-9_]{3,20}$")


class RegisterIn(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


def public_user(user):
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "bio": user["bio"],
        "course": user["course"],
        "year": user["year"],
        "created_at": user["created_at"],
    }


@router.post("/register")
def register(body: RegisterIn):
    first_name = body.first_name.strip()
    last_name = body.last_name.strip()
    username = body.username.strip().lower()
    email = body.email.lower()

    if first_name == "" or last_name == "":
        raise HTTPException(status_code=400, detail="Enter your first and last name.")
    if not USERNAME_PATTERN.match(username):
        raise HTTPException(
            status_code=400,
            detail="Usernames are 3–20 characters: lowercase letters, numbers, and underscores.",
        )
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Passwords need at least 8 characters.")

    if query_one("select id from users where email = :email", email=email) is not None:
        raise HTTPException(status_code=409, detail="That email already has an account. Log in instead.")
    if query_one("select id from users where username = :username", username=username) is not None:
        raise HTTPException(status_code=409, detail=f"@{username} is taken. Try another username.")

    user_id = new_id()
    execute(
        "insert into users (id, email, password_hash, username, first_name, last_name, created_at) "
        "values (:id, :email, :password_hash, :username, :first_name, :last_name, :created_at)",
        id=user_id,
        email=email,
        password_hash=hash_password(body.password),
        username=username,
        first_name=first_name,
        last_name=last_name,
        created_at=now_iso(),
    )

    user = query_one("select * from users where id = :id", id=user_id)
    return {"token": create_token(user_id), "user": public_user(user)}


@router.post("/login")
def login(body: LoginIn):
    user = query_one("select * from users where email = :email", email=body.email.lower())

    if user is None:
        raise HTTPException(status_code=401, detail="Wrong email or password.")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Wrong email or password.")

    return {"token": create_token(user["id"]), "user": public_user(user)}


@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"user": user}
