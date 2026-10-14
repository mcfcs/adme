import base64
import binascii
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from db import execute, new_id, now_iso, query, query_one
from security import get_current_user

router = APIRouter(prefix="/api/posts", tags=["posts"])

PAGE_SIZE = 15
MAX_LENGTH = 1000
MAX_IMAGE_BYTES = 2 * 1024 * 1024
IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

POST_SELECT = """
select
  p.id, p.content, p.as_org, p.created_at, p.updated_at,
  u.id as author_id, u.username as author_username,
  u.first_name as author_first_name, u.last_name as author_last_name,
  o.slug as org_slug, o.abbreviation as org_abbreviation, o.name as org_name, o.logo as org_logo,
  (select count(*) from post_images i where i.post_id = p.id) as has_image,
  (select count(*) from replies r where r.post_id = p.id) as reply_count,
  (select count(*) from post_likes l where l.post_id = p.id) as like_count,
  (select count(*) from post_likes l where l.post_id = p.id and l.user_id = :me) as liked_by_me
from posts p
join users u on u.id = p.author_id
left join organizations o on o.id = p.org_id
"""


class PostIn(BaseModel):
    content: str
    org_slug: Optional[str] = None
    as_org: bool = False
    image: Optional[str] = None


class PostEdit(BaseModel):
    content: str


def clean_content(raw):
    content = raw.strip()
    if content == "":
        raise HTTPException(status_code=400, detail="Write something before posting.")
    if len(content) > MAX_LENGTH:
        raise HTTPException(status_code=400, detail=f"Keep it under {MAX_LENGTH} characters.")
    return content


def parse_image(data_url):
    if not data_url.startswith("data:") or ";base64," not in data_url:
        raise HTTPException(status_code=400, detail="That image couldn't be read. Try a JPG or PNG.")

    header, encoded = data_url.split(";base64,", 1)
    mime = header[len("data:"):]
    if mime not in IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Images must be JPG, PNG, WebP or GIF.")

    try:
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="That image couldn't be read. Try a JPG or PNG.")

    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Images must be under 2 MB.")
    return mime, encoded


def format_post(row):
    org = None
    if row["org_slug"] is not None:
        org = {
            "slug": row["org_slug"],
            "abbreviation": row["org_abbreviation"],
            "name": row["org_name"],
            "logo": row["org_logo"],
        }

    image_url = None
    if int(row["has_image"]) > 0:
        image_url = f"/api/posts/{row['id']}/image"

    return {
        "id": row["id"],
        "content": row["content"],
        "as_org": int(row["as_org"]) == 1 and org is not None,
        "image_url": image_url,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "author": {
            "id": row["author_id"],
            "username": row["author_username"],
            "first_name": row["author_first_name"],
            "last_name": row["author_last_name"],
        },
        "org": org,
        "reply_count": int(row["reply_count"]),
        "like_count": int(row["like_count"]),
        "liked_by_me": int(row["liked_by_me"]) > 0,
    }


def get_post_or_404(post_id, me_id):
    row = query_one(POST_SELECT + " where p.id = :id", id=post_id, me=me_id)
    if row is None:
        raise HTTPException(status_code=404, detail="This post was deleted or never existed.")
    return format_post(row)


@router.get("")
def list_posts(
    scope: str = "all",
    org: Optional[str] = None,
    author: Optional[str] = None,
    before: Optional[str] = None,
    user=Depends(get_current_user),
):
    conditions = []
    params = {"me": user["id"], "limit": PAGE_SIZE + 1}

    if scope == "orgs":
        conditions.append("p.org_id in (select org_id from org_members where user_id = :me)")
    if org is not None:
        conditions.append("o.slug = :org")
        params["org"] = org
    if author is not None:
        conditions.append("u.username = :author")
        params["author"] = author
    if before is not None:
        conditions.append("p.created_at < :before")
        params["before"] = before

    sql = POST_SELECT
    if len(conditions) > 0:
        sql += " where " + " and ".join(conditions)
    sql += " order by p.created_at desc limit :limit"

    rows = query(sql, **params)

    next_cursor = None
    if len(rows) > PAGE_SIZE:
        rows = rows[:PAGE_SIZE]
        next_cursor = rows[-1]["created_at"]

    posts = []
    for row in rows:
        posts.append(format_post(row))
    return {"posts": posts, "next_cursor": next_cursor}


@router.post("", status_code=201)
def create_post(body: PostIn, user=Depends(get_current_user)):
    content = clean_content(body.content)

    org_id = None
    if body.org_slug:
        org = query_one("select id, abbreviation from organizations where slug = :slug", slug=body.org_slug)
        if org is None:
            raise HTTPException(status_code=404, detail="That organization does not exist.")
        membership = query_one(
            "select role from org_members where org_id = :org_id and user_id = :user_id",
            org_id=org["id"],
            user_id=user["id"],
        )
        if membership is None:
            raise HTTPException(status_code=403, detail=f"Join {org['abbreviation']} to post in it.")
        if body.as_org and membership["role"] != "admin":
            raise HTTPException(status_code=403, detail=f"Only {org['abbreviation']} admins can post as the org.")
        org_id = org["id"]

    if body.as_org and org_id is None:
        raise HTTPException(status_code=400, detail="Choose an org to post as.")

    image = None
    if body.image:
        image = parse_image(body.image)

    as_org = 0
    if body.as_org:
        as_org = 1

    post_id = new_id()
    execute(
        "insert into posts (id, author_id, org_id, as_org, content, created_at) "
        "values (:id, :author_id, :org_id, :as_org, :content, :created_at)",
        id=post_id,
        author_id=user["id"],
        org_id=org_id,
        as_org=as_org,
        content=content,
        created_at=now_iso(),
    )
    if image is not None:
        execute(
            "insert into post_images (post_id, mime, data) values (:post_id, :mime, :data)",
            post_id=post_id,
            mime=image[0],
            data=image[1],
        )
    return get_post_or_404(post_id, user["id"])


@router.get("/{post_id}")
def get_post(post_id: str, user=Depends(get_current_user)):
    return get_post_or_404(post_id, user["id"])


@router.get("/{post_id}/image")
def get_post_image(post_id: str):
    image = query_one("select mime, data from post_images where post_id = :id", id=post_id)
    if image is None:
        raise HTTPException(status_code=404, detail="This post has no image.")
    return Response(
        content=base64.b64decode(image["data"]),
        media_type=image["mime"],
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/{post_id}/likes")
def list_likes(post_id: str, user=Depends(get_current_user)):
    get_post_or_404(post_id, user["id"])
    users = query(
        "select u.id, u.username, u.first_name, u.last_name from post_likes l "
        "join users u on u.id = l.user_id where l.post_id = :post_id order by l.created_at desc",
        post_id=post_id,
    )
    return {"users": users}


@router.patch("/{post_id}")
def edit_post(post_id: str, body: PostEdit, user=Depends(get_current_user)):
    post = get_post_or_404(post_id, user["id"])
    if post["author"]["id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own posts.")

    content = clean_content(body.content)
    execute(
        "update posts set content = :content, updated_at = :updated_at where id = :id",
        content=content,
        updated_at=now_iso(),
        id=post_id,
    )
    return get_post_or_404(post_id, user["id"])


@router.delete("/{post_id}")
def delete_post(post_id: str, user=Depends(get_current_user)):
    post = get_post_or_404(post_id, user["id"])
    if post["author"]["id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own posts.")

    execute("delete from posts where id = :id", id=post_id)
    return {"deleted": True}


@router.post("/{post_id}/like")
def toggle_like(post_id: str, user=Depends(get_current_user)):
    post = get_post_or_404(post_id, user["id"])

    if post["liked_by_me"]:
        execute(
            "delete from post_likes where post_id = :post_id and user_id = :user_id",
            post_id=post_id,
            user_id=user["id"],
        )
    else:
        execute(
            "insert into post_likes (post_id, user_id, created_at) values (:post_id, :user_id, :created_at)",
            post_id=post_id,
            user_id=user["id"],
            created_at=now_iso(),
        )

    updated = get_post_or_404(post_id, user["id"])
    return {"liked_by_me": updated["liked_by_me"], "like_count": updated["like_count"]}
