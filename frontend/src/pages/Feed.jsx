import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import MyOrgsPanel, { useMyOrgs } from "../components/MyOrgs";
import PostComposer from "../components/PostComposer";
import PostFeed, { usePostFeed } from "../components/PostFeed";

const TABS = [
  { id: "all", label: "Everyone" },
  { id: "orgs", label: "My orgs" },
];

export default function Feed() {
  const { user } = useAuth();
  const myOrgs = useMyOrgs();
  const [tab, setTab] = useState("all");
  const feed = usePostFeed(`scope=${tab}`);

  function handleCreated(post) {
    if (tab === "orgs" && !post.org) {
      return;
    }
    feed.addPost(post);
  }

  let emptyTitle = "No posts yet";
  let emptyText = "Be the first to say something.";
  if (tab === "orgs") {
    emptyTitle = "Nothing from your orgs yet";
    emptyText = "Join orgs, or post in one you're already in.";
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <h1 className="text-4xl font-extrabold leading-tight text-zpink sm:text-6xl">
          Hi {user.first_name},
        </h1>
        <p className="mb-6 text-4xl font-extrabold leading-tight text-zpink sm:text-6xl">check these out!</p>

        <PostComposer myOrgs={myOrgs} onCreated={handleCreated} />

        <div className="mt-6 mb-4 flex gap-2" role="group" aria-label="Choose feed">
          {TABS.map((item) => {
            let style = "bg-white text-zblue hover:bg-mist";
            if (item.id === tab) {
              style = "bg-zblue text-white";
            }
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === tab}
                onClick={() => setTab(item.id)}
                className={`rounded-full px-5 py-2 text-sm font-bold shadow-sm transition ${style}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <PostFeed feed={feed} emptyTitle={emptyTitle} emptyText={emptyText} />
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <MyOrgsPanel orgs={myOrgs} />
        </div>
      </aside>
    </div>
  );
}
