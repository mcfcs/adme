import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, X } from "lucide-react";
import { api } from "../lib/api";
import Avatar from "./Avatar";
import Spinner from "./Spinner";

export default function LikesDialog({ postId, onClose }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/posts/${postId}/likes`)
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message));
  }, [postId]);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  let body = <Spinner label="Loading likes" />;
  if (error) {
    body = <p className="px-6 py-8 text-center text-sm text-red-600">{error}</p>;
  } else if (users && users.length === 0) {
    body = <p className="px-6 py-8 text-center text-sm text-slate-500">No likes yet.</p>;
  } else if (users) {
    body = (
      <ul className="max-h-[60vh] overflow-y-auto py-2">
        {users.map((person) => (
          <li key={person.id}>
            <Link
              to={`/u/${person.username}`}
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-2.5 transition hover:bg-page"
            >
              <div className="relative">
                <Avatar name={person.first_name} />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-zpink">
                  <Heart size={10} fill="white" className="text-white" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{person.first_name} {person.last_name}</p>
                <p className="truncate text-xs text-slate-500">@{person.username}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="likes-title"
        className="animate-toast-in w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="likes-title" className="text-lg font-black text-slate-900">Liked by</h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        {body}
      </div>
    </div>
  );
}
