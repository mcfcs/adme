from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import execute, new_id, now_iso, query, query_one
from routes.posts import clean_content, get_post_or_404
from security import get_current_user

router = APIRouter(prefix="/api", tags=["replies"])

REPLY_SELECT = """
select
  r.id, r.post_id, r.parent_id, r.content, r.created_at, r.updated_at,
  u.id as author_id, u.username as author_username,
  u.first_name as author_first_name, u.last_name as author_last_name
from replies r
join users u on u.id = r.author_id
"""


class ReplyIn(BaseModel):
    content: str
    parent_id: Optional[str] = None


class ReplyEdit(BaseModel):
    content: str


def format_reply(row):
    return {
        "id": row["id"],
        "post_id": row["post_id"],
        "parent_id": row["parent_id"],
        "content": row["content"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "author": {
            "id": row["author_id"],
            "username": row["author_username"],
            "first_name": row["author_first_name"],
            "last_name": row["author_last_name"],
        },
    }


def get_reply_or_404(reply_id):
    row = query_one(REPLY_SELECT + " where r.id = :id", id=reply_id)
    if row is None:
        raise HTTPException(status_code=404, detail="This reply was deleted or never existed.")
    return format_reply(row)


@router.get("/posts/{post_id}/replies")
def list_replies(post_id: str, user=Depends(get_current_user)):
    get_post_or_404(post_id, user["id"])
    rows = query(REPLY_SELECT + " where r.post_id = :post_id order by r.created_at asc", post_id=post_id)

    replies = []
    for row in rows:
        replies.append(format_reply(row))
    return {"replies": replies}


@router.post("/posts/{post_id}/replies", status_code=201)
def create_reply(post_id: str, body: ReplyIn, user=Depends(get_current_user)):
    get_post_or_404(post_id, user["id"])
    content = clean_content(body.content)

    if body.parent_id is not None:
        parent = get_reply_or_404(body.parent_id)
        if parent["post_id"] != post_id:
            raise HTTPException(status_code=400, detail="That reply belongs to a different post.")

    reply_id = new_id()
    execute(
        "insert into replies (id, post_id, parent_id, author_id, content, created_at) "
        "values (:id, :post_id, :parent_id, :author_id, :content, :created_at)",
        id=reply_id,
        post_id=post_id,
        parent_id=body.parent_id,
        author_id=user["id"],
        content=content,
        created_at=now_iso(),
    )
    return get_reply_or_404(reply_id)


@router.patch("/replies/{reply_id}")
def edit_reply(reply_id: str, body: ReplyEdit, user=Depends(get_current_user)):
    reply = get_reply_or_404(reply_id)
    if reply["author"]["id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own replies.")

    content = clean_content(body.content)
    execute(
        "update replies set content = :content, updated_at = :updated_at where id = :id",
        content=content,
        updated_at=now_iso(),
        id=reply_id,
    )
    return get_reply_or_404(reply_id)


@router.delete("/replies/{reply_id}")
def delete_reply(reply_id: str, user=Depends(get_current_user)):
    reply = get_reply_or_404(reply_id)
    if reply["author"]["id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own replies.")

    execute("delete from replies where id = :id", id=reply_id)
    return {"deleted": True}
