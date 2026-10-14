import base64
from datetime import datetime, timedelta, timezone

from db import BACKEND_DIR, execute, init_db, new_id, query_one
from security import hash_password

PASSWORD = "adme12345"
IMAGES = BACKEND_DIR / "data" / "demo-images"

USERS = [
    ("bea", "Bea", "de Castro", "BS CS", "3rd Year", "CompSAt · code, coffee, and Corgear merch"),
    ("hubert", "Hubert Ellyson", "Olegario", "BS ME", "2nd Year", "debate on weekdays, basketball on weekends"),
    ("princess", "Princess May", "Giron", "AB Comm", "1st Year", "photos and too many orgs"),
]

MEMBERSHIPS = [
    ("bea", "compsat", "admin"),
    ("bea", "devsoc-ateneo", "member"),
    ("hubert", "ads", "admin"),
    ("hubert", "compsat", "member"),
    ("princess", "zoom", "admin"),
    ("princess", "bluerep", "member"),
    ("princess", "compsat", "member"),
]

GEEKSHOP = """Corgear's looking for faces to join the throwback! 📸👾

Volunteer as a model for GeekShop 2026: Retrospect, and help us showcase our merchandise. From the games we grew up with to the merch we can wear today, help us bring a little nostalgia to the camera. 💾🕹️

Models will get a free shirt! 👕 Sign up at tinyurl.com/GS26-ModelVolunteer by 11:59 PM on Wednesday, 14 October 2026 or before slots run out!

Promo by Sofia Nocom
Spiel by Robin Cacho"""

COMMUNITY_NIGHT = """Corgear is on the lookout for talent on stage... 🎪

CompSAt is inviting performers to take the stage at Community Night 2026! 🎤💃 Sing, dance, show a magic trick, or surprise us with your own kind of performance. 🎭

Sign up as a solo, duo, or trio act at tinyurl.com/CN26-Performers. Applications are open until Wednesday, 21 October 2026 at 11:59 PM, so submit them before the curtain closes! Come be part of the fun and help us make the night unforgettable. 🤩✨

Mark your calendars as well for d-day on Tuesday, 3 November 2026 from 5:00 PM to 8:00 PM at Faura AVR. Expect a night filled with music, fun, and plenty of opportunities to connect with the CompSAt community! 🎉🥳

Promo by Pau Aranas
Spiel by Eurenz Callo"""

POSTS = [
    ("bea", "compsat", True, 60, "community-night.jpg", COMMUNITY_NIGHT),
    ("princess", None, False, 15, None, "Gonzaga line at 11:58 is a social experiment and I am the subject."),
    ("hubert", "ads", True, 95, None,
     "ADS Novice Workshop this Saturday, 9 AM at SEC-A 117! 🗣️\n\nNever debated before? Perfect. We'll cover case building, rebuttals, and how to not panic during POIs. Open to all years and courses.\n\nRegister at tinyurl.com/ADS-Novice26"),
    ("bea", None, False, 130, None, "Who's performing at Community Night? @hubert I know you have a magic trick hiding somewhere."),
    ("princess", "zoom", True, 240, None,
     "ZOOM Photowalk: Golden Hour Edition 🌅📷\n\nJoin us this Friday, 4:30 PM, starting at the Church of the Gesù. Any camera works, phones included. We'll end at the Xavier Hall side for sunset shots.\n\nSee you there!"),
    ("hubert", None, False, 300, None, "Hot take: Kostka steps are the best study spot on campus."),
    ("princess", "bluerep", False, 420, None, "blueREP rehearsals are taking over my whole week and honestly? No regrets."),
    ("bea", "devsoc-ateneo", False, 600, None, "Anyone from DevSoc want to team up for the hackathon? Need one more backend person."),
    ("hubert", None, False, 900, None, "Is the Rizal Library aircon set to 'arctic' on purpose? Asking for my fingers."),
    ("princess", None, False, 1300, None, "Ateneo sunsets from the Xavier Hall side never miss."),
    ("bea", None, False, 2000, None, "PSA: the Wi-Fi near the CTC lobby is back."),
    ("hubert", None, False, 3000, None, "Who else is surviving on Jollibee and caffeine this hell week?"),
    ("princess", None, False, 4200, None, "Lost: blue umbrella near Faura. If found, it misses me."),
    ("bea", "compsat", True, 7450, "geekshop-model.jpg", GEEKSHOP),
    ("hubert", None, False, 8000, None, "First week of second sem done. Already behind on readings. Classic."),
    ("princess", None, False, 9000, None, "Reminder that the Blue Eagle Gym is open late this week. Pickup volleyball anyone?"),
]

REPLIES = [
    (0, "hubert", 5, "Signing up as a solo act. Don't ask what the act is yet.", None),
    (0, "princess", 8, "@hubert it's the magic trick isn't it", 0),
    (0, "hubert", 9, "...no comment 🎩", 1),
    (0, "princess", 12, "Can ZOOM cover the event? We'd love to shoot it!", None),
    (0, "bea", 20, "@princess yes please! DM the CompSAt page and we'll coordinate.", 3),
    (1, "hubert", 3, "Go at 11:40. Trust.", None),
    (1, "princess", 4, "@hubert 11:40 is when my class ends 😭", 5),
    (2, "princess", 10, "Is this okay for total beginners?", None),
    (2, "hubert", 12, "@princess 100%. Most of our members started from zero.", 7),
    (3, "hubert", 6, "I will neither confirm nor deny.", None),
    (13, "princess", 30, "Signing up!! The shirt is too cute.", None),
    (13, "hubert", 45, "Corgear in sunglasses is peak design.", None),
]

LIKES = [
    (0, "hubert"), (0, "princess"), (1, "bea"), (1, "hubert"), (2, "bea"), (2, "princess"),
    (3, "princess"), (4, "bea"), (4, "hubert"), (5, "princess"), (9, "bea"), (13, "hubert"), (13, "princess"),
]


def iso_minutes_ago(minutes):
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()


def org_id(slug):
    return query_one("select id from organizations where slug = :slug", slug=slug)["id"]


def main():
    init_db()

    if query_one("select id from users where username = 'bea'") is not None:
        print("Demo data is already there. Nothing to do.")
        return

    user_ids = {}
    for username, first, last, course, year, bio in USERS:
        user_ids[username] = new_id()
        execute(
            "insert into users (id, email, password_hash, username, first_name, last_name, bio, course, year, created_at) "
            "values (:id, :email, :password_hash, :username, :first, :last, :bio, :course, :year, :created_at)",
            id=user_ids[username],
            email=f"{username}@example.com",
            password_hash=hash_password(PASSWORD),
            username=username,
            first=first,
            last=last,
            bio=bio,
            course=course,
            year=year,
            created_at=iso_minutes_ago(20000),
        )

    for username, slug, role in MEMBERSHIPS:
        execute(
            "insert into org_members (org_id, user_id, role, joined_at) values (:org_id, :user_id, :role, :joined_at)",
            org_id=org_id(slug),
            user_id=user_ids[username],
            role=role,
            joined_at=iso_minutes_ago(15000),
        )

    post_ids = []
    for username, slug, as_org, minutes, image, content in POSTS:
        post_org = None
        if slug is not None:
            post_org = org_id(slug)
        as_org_value = 0
        if as_org:
            as_org_value = 1
        post_id = new_id()
        post_ids.append((post_id, minutes))
        execute(
            "insert into posts (id, author_id, org_id, as_org, content, created_at) "
            "values (:id, :author_id, :org_id, :as_org, :content, :created_at)",
            id=post_id,
            author_id=user_ids[username],
            org_id=post_org,
            as_org=as_org_value,
            content=content,
            created_at=iso_minutes_ago(minutes),
        )
        if image is not None:
            execute(
                "insert into post_images (post_id, mime, data) values (:post_id, 'image/jpeg', :data)",
                post_id=post_id,
                data=base64.b64encode((IMAGES / image).read_bytes()).decode(),
            )

    reply_ids = []
    for index, username, after, content, parent_index in REPLIES:
        post_id, minutes = post_ids[index]
        parent_id = None
        if parent_index is not None:
            parent_id = reply_ids[parent_index]
        reply_id = new_id()
        reply_ids.append(reply_id)
        execute(
            "insert into replies (id, post_id, parent_id, author_id, content, created_at) "
            "values (:id, :post_id, :parent_id, :author_id, :content, :created_at)",
            id=reply_id,
            post_id=post_id,
            parent_id=parent_id,
            author_id=user_ids[username],
            content=content,
            created_at=iso_minutes_ago(max(minutes - after, 0)),
        )

    for index, username in LIKES:
        execute(
            "insert into post_likes (post_id, user_id, created_at) values (:post_id, :user_id, :created_at)",
            post_id=post_ids[index][0],
            user_id=user_ids[username],
            created_at=iso_minutes_ago(0),
        )

    print(f"Added {len(USERS)} demo users and {len(POSTS)} posts.")
    print(f"Log in with bea@example.com, hubert@example.com or princess@example.com, password: {PASSWORD}")


if __name__ == "__main__":
    main()
