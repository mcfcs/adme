import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { API_URL, api } from "../lib/api";
import { fullDate, timeAgo } from "../lib/time";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "./Avatar";
import ConfirmDialog from "./ConfirmDialog";
import EditBox from "./EditBox";
import LikesDialog from "./LikesDialog";
import OrgLogo from "./OrgLogo";
import OrgStamp from "./OrgStamp";
import RichText from "./RichText";

export default function PostCard({ post, onChange, onDelete, full = false }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [popHeart, setPopHeart] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  const isMine = post.author.id === user.id;

  function openPost(event) {
    if (full || editing) {
      return;
    }
    if (event.target.closest("a, button, textarea, select, input")) {
      return;
    }
    if (window.getSelection().toString() !== "") {
      return;
    }
    navigate(`/post/${post.id}`);
  }

  function handleKeyDown(event) {
    if (full) {
      return;
    }
    if (event.key === "Enter" && event.target === event.currentTarget) {
      navigate(`/post/${post.id}`);
    }
  }

  async function toggleLike() {
    if (likeBusy) {
      return;
    }
    setPopHeart(!post.liked_by_me);
    const before = post;
    let likeCount = post.like_count + 1;
    if (post.liked_by_me) {
      likeCount = post.like_count - 1;
    }
    onChange({ ...post, liked_by_me: !post.liked_by_me, like_count: likeCount });

    setLikeBusy(true);
    try {
      const result = await api(`/api/posts/${post.id}/like`, { method: "POST" });
      onChange({ ...before, liked_by_me: result.liked_by_me, like_count: result.like_count });
    } catch (error) {
      onChange(before);
      toast.error(error.message);
    } finally {
      setLikeBusy(false);
    }
  }

  async function saveEdit(content) {
    try {
      const updated = await api(`/api/posts/${post.id}`, { method: "PATCH", body: { content } });
      onChange(updated);
      setEditing(false);
      toast.success("Post updated");
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api(`/api/posts/${post.id}`, { method: "DELETE" });
      setConfirming(false);
      toast.success("Post deleted");
      onDelete(post.id);
    } catch (error) {
      toast.error(error.message);
      setDeleting(false);
    }
  }

  let cardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";
  let tabIndex;
  if (!full) {
    cardClass += " cursor-pointer transition hover:border-zblue/40 hover:shadow-md";
    tabIndex = 0;
  }
  if (post.just_posted) {
    cardClass += " animate-flash";
  }

  const isLong = post.content.length > 280 || post.content.split("\n").length > 6;
  let contentClass = "mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800";
  if (full) {
    contentClass = "mt-3 whitespace-pre-wrap break-words text-lg leading-relaxed text-slate-900";
  } else if (isLong && !expanded) {
    contentClass += " line-clamp-6";
  }

  let imageClass = "mt-3 block max-h-[560px] max-w-full rounded-xl border border-slate-200";
  if (full) {
    imageClass = "mt-4 block max-w-full rounded-xl border border-slate-200";
  }

  let likeClass = "text-slate-500 hover:bg-zpink/10 hover:text-zpink";
  let heartFill = "none";
  let likeLabel = "Like";
  if (post.liked_by_me) {
    likeClass = "text-zpink hover:bg-zpink/10";
    heartFill = "currentColor";
    likeLabel = "Unlike";
  }

  let heartClass = "";
  if (popHeart) {
    heartClass = "animate-pop";
  }

  let timeLabel = timeAgo(post.created_at);
  if (full) {
    timeLabel = fullDate(post.created_at);
  }

  let authorName = `${post.author.first_name} ${post.author.last_name}`;
  let avatar = (
    <Link to={`/u/${post.author.username}`} aria-label={`${post.author.first_name}'s profile`}>
      <Avatar name={post.author.first_name} />
    </Link>
  );
  let nameLine = (
    <>
      <Link to={`/u/${post.author.username}`} className="truncate font-bold text-slate-900 hover:underline">
        {authorName}
      </Link>
      <span className="truncate text-slate-500">@{post.author.username}</span>
    </>
  );
  if (post.as_org) {
    authorName = post.org.name;
    avatar = (
      <Link to={`/orgs/${post.org.slug}`} aria-label={`${post.org.abbreviation} page`}>
        <OrgLogo org={post.org} size="md" />
      </Link>
    );
    nameLine = (
      <>
        <Link to={`/orgs/${post.org.slug}`} className="truncate font-bold text-slate-900 hover:underline">
          {post.org.name}
        </Link>
        <span className="rounded-md bg-zblue px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Org</span>
        <span className="truncate text-slate-500">
          by <Link to={`/u/${post.author.username}`} className="hover:underline">@{post.author.username}</Link>
        </span>
      </>
    );
  }

  return (
    <>
      <article
        className={cardClass}
        onClick={openPost}
        onKeyDown={handleKeyDown}
        tabIndex={tabIndex}
        aria-label={`Post by ${authorName}`}
      >
        <div className="flex gap-3">
          {avatar}

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 text-sm">
                {nameLine}
                <span className="text-slate-400" aria-hidden="true">·</span>
                <time dateTime={post.created_at} title={fullDate(post.created_at)} className="text-slate-500">
                  {timeLabel}
                </time>
                {post.updated_at && (
                  <span className="text-xs italic text-slate-400" title={`Edited ${fullDate(post.updated_at)}`}>
                    edited
                  </span>
                )}
              </div>

              {isMine && !editing && (
                <div className="-mr-2 -mt-1 flex shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    aria-label="Edit post"
                    title="Edit"
                    className="rounded-full p-2 text-slate-400 transition hover:bg-zblue/10 hover:text-zblue"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    aria-label="Delete post"
                    title="Delete"
                    className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {post.org && !post.as_org && (
              <div className="mt-1">
                <OrgStamp org={post.org} />
              </div>
            )}

            {editing && (
              <EditBox initialText={post.content} onSave={saveEdit} onCancel={() => setEditing(false)} />
            )}
            {!editing && (
              <p className={contentClass}>
                <RichText text={post.content} />
              </p>
            )}
            {!editing && !full && isLong && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-1 text-sm font-bold text-zblue hover:underline"
              >
                Show more
              </button>
            )}

            {post.image_url && (
              <img src={API_URL + post.image_url} alt={`Image posted by ${authorName}`} loading="lazy" className={imageClass} />
            )}

            <div className="-ml-2 mt-3 flex items-center gap-4 text-sm">
              <Link
                to={`/post/${post.id}`}
                aria-label={`${post.reply_count} replies`}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-slate-500 transition hover:bg-zblue/10 hover:text-zblue"
              >
                <MessageCircle size={18} />
                <span className="tabular-nums">{post.reply_count}</span>
              </Link>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={toggleLike}
                  aria-pressed={post.liked_by_me}
                  aria-label={`${likeLabel} (${post.like_count} likes)`}
                  className={`flex items-center rounded-full p-1.5 transition ${likeClass}`}
                >
                  <Heart size={18} fill={heartFill} key={String(post.liked_by_me)} className={heartClass} />
                </button>
                {post.like_count > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowLikes(true)}
                    aria-label={`See who liked this (${post.like_count})`}
                    title="See who liked this"
                    className="rounded-full px-1.5 py-1 tabular-nums text-slate-500 transition hover:text-zpink hover:underline"
                  >
                    {post.like_count}
                  </button>
                )}
                {post.like_count === 0 && (
                  <span className="px-1.5 tabular-nums text-slate-500">0</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      {showLikes && <LikesDialog postId={post.id} onClose={() => setShowLikes(false)} />}

      {confirming && (
        <ConfirmDialog
          title="Delete this post?"
          message="It will be removed from the feed along with its replies. You can't undo this."
          confirmLabel="Delete post"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
