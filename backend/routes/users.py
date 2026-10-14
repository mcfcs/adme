from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import execute, query, query_one
from routes.orgs import ORG_SELECT, format_org
from security import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


class ProfileEdit(BaseModel):
    first_name: str
    last_name: str
    bio: Optional[str] = None
    course: Optional[str] = None
    year: Optional[str] = None


def blank_to_none(value):
    if value is None:
        return None
    value = value.strip()
    if value == "":
        return None
    return value


@router.get("/{username}")
def get_profile(username: str, user=Depends(get_current_user)):
    profile = query_one(
        "select id, username, first_name, last_name, bio, course, year, created_at, "
        "(select count(*) from posts p where p.author_id = users.id) as post_count "
        "from users where username = :username",
        username=username.lower(),
    )
    if profile is None:
        raise HTTPException(status_code=404, detail=f"No one goes by @{username}.")
    profile["post_count"] = int(profile["post_count"])

    rows = query(
        ORG_SELECT + " where o.id in (select org_id from org_members where user_id = :owner) "
        "order by lower(o.abbreviation)",
        me=user["id"],
        owner=profile["id"],
    )
    orgs = []
    for row in rows:
        orgs.append(format_org(row))

    return {"profile": profile, "orgs": orgs, "is_me": profile["id"] == user["id"]}


@router.patch("/me")
def edit_profile(body: ProfileEdit, user=Depends(get_current_user)):
    first_name = body.first_name.strip()
    last_name = body.last_name.strip()
    if first_name == "" or last_name == "":
        raise HTTPException(status_code=400, detail="Your first and last name can't be empty.")

    bio = blank_to_none(body.bio)
    if bio is not None and len(bio) > 160:
        raise HTTPException(status_code=400, detail="Keep your bio under 160 characters.")

    execute(
        "update users set first_name = :first_name, last_name = :last_name, bio = :bio, "
        "course = :course, year = :year where id = :id",
        first_name=first_name,
        last_name=last_name,
        bio=bio,
        course=blank_to_none(body.course),
        year=blank_to_none(body.year),
        id=user["id"],
    )
    updated = query_one(
        "select id, email, username, first_name, last_name, bio, course, year, created_at "
        "from users where id = :id",
        id=user["id"],
    )
    return {"user": updated}
