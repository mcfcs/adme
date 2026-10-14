create table if not exists users (
  id             text primary key,
  email          text not null unique,
  password_hash  text not null,
  username       text not null unique,
  first_name     text not null,
  last_name      text not null,
  bio            text,
  course         text,
  year           text,
  created_at     text not null
);

create table if not exists organizations (
  id            text primary key,
  name          text not null,
  abbreviation  text not null,
  cluster       text,
  slug          text not null unique,
  logo          text,
  description   text,
  created_at    text not null
);

create table if not exists org_members (
  org_id     text not null references organizations (id) on delete cascade,
  user_id    text not null references users (id) on delete cascade,
  role       text not null default 'member',
  joined_at  text not null,
  primary key (org_id, user_id)
);

create table if not exists posts (
  id          text primary key,
  author_id   text not null references users (id) on delete cascade,
  org_id      text references organizations (id) on delete set null,
  as_org      integer not null default 0,
  content     text not null check (length(content) between 1 and 1000),
  created_at  text not null,
  updated_at  text
);

create table if not exists replies (
  id          text primary key,
  post_id     text not null references posts (id) on delete cascade,
  parent_id   text references replies (id) on delete cascade,
  author_id   text not null references users (id) on delete cascade,
  content     text not null check (length(content) between 1 and 1000),
  created_at  text not null,
  updated_at  text
);

create table if not exists post_images (
  post_id  text primary key references posts (id) on delete cascade,
  mime     text not null,
  data     text not null
);

create table if not exists post_likes (
  post_id     text not null references posts (id) on delete cascade,
  user_id     text not null references users (id) on delete cascade,
  created_at  text not null,
  primary key (post_id, user_id)
);

create index if not exists posts_created_at_idx on posts (created_at);
create index if not exists posts_org_id_idx on posts (org_id);
create index if not exists posts_author_id_idx on posts (author_id);
create index if not exists replies_post_id_idx on replies (post_id);
create index if not exists org_members_user_id_idx on org_members (user_id);
