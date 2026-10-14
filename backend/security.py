import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db import query_one

JWT_SECRET = os.getenv("JWT_SECRET", "")
if JWT_SECRET == "":
    print("[security] JWT_SECRET is empty, using an insecure development secret")
    JWT_SECRET = "dev-only-secret-change-me"

TOKEN_DAYS = 7
HASH_ITERATIONS = 200_000

bearer = HTTPBearer(auto_error=False)


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), HASH_ITERATIONS)
    return f"{salt}${digest.hex()}"


def verify_password(password, stored_hash):
    salt, expected = stored_hash.split("$", 1)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), HASH_ITERATIONS)
    return hmac.compare_digest(digest.hex(), expected)


def create_token(user_id):
    expires = datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS)
    return jwt.encode({"sub": user_id, "exp": expires}, JWT_SECRET, algorithm="HS256")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Log in to continue.")

    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Your session expired. Log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session. Log in again.")

    user = query_one(
        "select id, email, username, first_name, last_name, bio, course, year, created_at "
        "from users where id = :id",
        id=payload["sub"],
    )
    if user is None:
        raise HTTPException(status_code=401, detail="Account not found. Log in again.")
    return user
