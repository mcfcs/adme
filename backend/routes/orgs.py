from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from db import execute, now_iso, query, query_one
from security import get_current_user

router = APIRouter(prefix="/api", tags=["orgs"])

ORG_SELECT = """
select
  o.id, o.name, o.abbreviation, o.cluster, o.slug, o.logo, o.description,
  (select count(*) from org_members m where m.org_id = o.id) as member_count,
  (select count(*) from org_members m where m.org_id = o.id and m.user_id = :me) as is_member,
  (select m.role from org_members m where m.org_id = o.id and m.user_id = :me) as my_role,
  (select count(*) from posts p where p.org_id = o.id) as post_count
from organizations o
"""


def format_org(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "abbreviation": row["abbreviation"],
        "cluster": row["cluster"],
        "slug": row["slug"],
        "logo": row["logo"],
        "description": row["description"],
        "member_count": int(row["member_count"]),
        "post_count": int(row["post_count"]),
        "is_member": int(row["is_member"]) > 0,
        "my_role": row["my_role"],
    }


def get_org_or_404(slug, me_id):
    row = query_one(ORG_SELECT + " where o.slug = :slug", slug=slug, me=me_id)
    if row is None:
        raise HTTPException(status_code=404, detail="That organization does not exist.")
    return format_org(row)


@router.get("/orgs")
def list_orgs(q: Optional[str] = None, user=Depends(get_current_user)):
    sql = ORG_SELECT
    params = {"me": user["id"]}

    if q is not None and q.strip() != "":
        sql += " where lower(o.name) like :q or lower(o.abbreviation) like :q"
        params["q"] = "%" + q.strip().lower() + "%"

    sql += " order by o.cluster, lower(o.abbreviation)"

    orgs = []
    for row in query(sql, **params):
        orgs.append(format_org(row))
    return {"orgs": orgs}


@router.get("/orgs/{slug}")
def get_org(slug: str, user=Depends(get_current_user)):
    org = get_org_or_404(slug, user["id"])
    members = query(
        "select u.id, u.username, u.first_name, u.last_name, m.role from org_members m "
        "join users u on u.id = m.user_id where m.org_id = :org_id "
        "order by case when m.role = 'admin' then 0 else 1 end, m.joined_at asc",
        org_id=org["id"],
    )
    return {"org": org, "members": members}


@router.post("/orgs/{slug}/membership")
def join_org(slug: str, user=Depends(get_current_user)):
    org = get_org_or_404(slug, user["id"])
    if not org["is_member"]:
        role = "member"
        admin = query_one(
            "select 1 as ok from org_members where org_id = :org_id and role = 'admin'",
            org_id=org["id"],
        )
        if admin is None:
            role = "admin"
        execute(
            "insert into org_members (org_id, user_id, role, joined_at) "
            "values (:org_id, :user_id, :role, :joined_at)",
            org_id=org["id"],
            user_id=user["id"],
            role=role,
            joined_at=now_iso(),
        )
    return get_org_or_404(slug, user["id"])


@router.delete("/orgs/{slug}/membership")
def leave_org(slug: str, user=Depends(get_current_user)):
    org = get_org_or_404(slug, user["id"])
    execute(
        "delete from org_members where org_id = :org_id and user_id = :user_id",
        org_id=org["id"],
        user_id=user["id"],
    )
    return get_org_or_404(slug, user["id"])


@router.get("/me/orgs")
def my_orgs(user=Depends(get_current_user)):
    rows = query(
        ORG_SELECT + " where o.id in (select org_id from org_members where user_id = :me) "
        "order by lower(o.abbreviation)",
        me=user["id"],
    )
    orgs = []
    for row in rows:
        orgs.append(format_org(row))
    return {"orgs": orgs}
