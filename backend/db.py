import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import dotenv_values
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.pool import NullPool

BACKEND_DIR = Path(__file__).resolve().parent
CONFIG_ERROR = None


def load_env_files():
    for env_file in [BACKEND_DIR / ".env", BACKEND_DIR.parent / ".env"]:
        for key, value in dotenv_values(env_file).items():
            if value and not os.environ.get(key):
                os.environ[key] = value


load_env_files()


def build_engine():
    global CONFIG_ERROR
    url = os.getenv("DATABASE_URL", "").strip()

    if url == "" and os.getenv("VERCEL"):
        CONFIG_ERROR = "DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables, then redeploy."
        return create_engine("sqlite://")

    if url == "":
        local_path = BACKEND_DIR / "local.db"
        print(f"[db] DATABASE_URL is empty, using local SQLite file: {local_path}")
        engine = create_engine(f"sqlite:///{local_path}", connect_args={"check_same_thread": False})

        @event.listens_for(engine, "connect")
        def enable_foreign_keys(connection, _record):
            cursor = connection.cursor()
            cursor.execute("PRAGMA foreign_keys = ON")
            cursor.close()

        return engine

    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]

    print("[db] Using Postgres (Supabase)")
    return create_engine(url, poolclass=NullPool, connect_args={"prepare_threshold": None})


engine = build_engine()
IS_POSTGRES = engine.dialect.name == "postgresql"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


def query(sql, **params):
    with engine.connect() as conn:
        result = conn.execute(text(sql), params)
        return [dict(row) for row in result.mappings()]


def query_one(sql, **params):
    rows = query(sql, **params)
    if len(rows) == 0:
        return None
    return rows[0]


def execute(sql, **params):
    with engine.begin() as conn:
        result = conn.execute(text(sql), params)
        return result.rowcount


def add_missing_column(conn, table, column, definition):
    existing = []
    for info in inspect(conn).get_columns(table):
        existing.append(info["name"])
    if column not in existing:
        conn.execute(text(f"alter table {table} add column {column} {definition}"))
        print(f"[db] Added {table}.{column}")


def init_db():
    schema = (BACKEND_DIR / "schema.sql").read_text(encoding="utf-8")

    lines = []
    for line in schema.splitlines():
        if not line.strip().startswith("--"):
            lines.append(line)
    statements = "\n".join(lines).split(";")

    with engine.begin() as conn:
        for statement in statements:
            if statement.strip() != "":
                conn.execute(text(statement))

        add_missing_column(conn, "replies", "parent_id", "text references replies (id) on delete cascade")
        add_missing_column(conn, "org_members", "role", "text not null default 'member'")
        add_missing_column(conn, "posts", "as_org", "integer not null default 0")
        conn.execute(text("create index if not exists replies_parent_id_idx on replies (parent_id)"))

        if IS_POSTGRES:
            for table in ["users", "organizations", "org_members", "posts", "post_images", "replies", "post_likes"]:
                conn.execute(text(f"alter table {table} enable row level security"))

        org_count = conn.execute(text("select count(*) from organizations")).scalar()
        if org_count == 0:
            orgs = json.loads((BACKEND_DIR / "data" / "orgs.json").read_text(encoding="utf-8"))
            for org in orgs:
                conn.execute(
                    text(
                        "insert into organizations (id, name, abbreviation, cluster, slug, logo, created_at) "
                        "values (:id, :name, :abbreviation, :cluster, :slug, :logo, :created_at) "
                        "on conflict (slug) do nothing"
                    ),
                    {**org, "id": new_id(), "created_at": now_iso()},
                )
            print(f"[db] Loaded {len(orgs)} organizations")
