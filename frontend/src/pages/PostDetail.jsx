import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import PostCard from "../components/PostCard";
import ReplyComposer from "../components/ReplyComposer";
import ReplyTree from "../components/ReplyTree";
import Spinner from "../components/Spinner";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([api(`/api/posts/${id}`), api(`/api/posts/${id}/replies`)])
      .then(([postData, replyData]) => {
        setPost(postData);
        setReplies(replyData.replies);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function goBack() {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  function handleReplyAdded(reply) {
    setReplies((current) => [...current, reply]);
    setPost((current) => ({ ...current, reply_count: current.reply_count + 1 }));
  }

  function handleReplyChanged(updated) {
    setReplies((current) => current.map((reply) => {
      if (reply.id === updated.id) {
        return updated;
      }
      return reply;
    }));
  }

  function handleReplyDeleted(replyId) {
    const removed = [replyId];
    for (let i = 0; i < removed.length; i++) {
      for (const reply of replies) {
        if (reply.parent_id === removed[i]) {
          removed.push(reply.id);
        }
      }
    }
    setReplies((current) => current.filter((reply) => !removed.includes(reply.id)));
    setPost((current) => ({ ...current, reply_count: current.reply_count - removed.length }));
  }

  let body = null;
  if (loading) {
    body = <Spinner label="Loading post" />;
  } else if (error) {
    body = (
      <div className="rounded-2xl border-2 border-dashed border-mist bg-white/60 px-6 py-12 text-center">
        <p className="text-lg font-black text-zblue">{error}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-semibold text-zblue hover:underline">Back to the feed</Link>
      </div>
    );
  } else {
    body = (
      <>
        <PostCard post={post} onChange={setPost} onDelete={() => navigate("/", { replace: true })} full />

        <section aria-label="Replies" className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ReplyComposer postId={post.id} replyingTo={post.author.username} onAdded={handleReplyAdded} />

          {replies.length === 0 && (
            <p className="border-t border-slate-100 px-5 py-8 text-center text-sm text-slate-500">
              No replies yet. Start the conversation.
            </p>
          )}

          {replies.length > 0 && (
            <ReplyTree
              replies={replies}
              onAdded={handleReplyAdded}
              onChange={handleReplyChanged}
              onDelete={handleReplyDeleted}
            />
          )}
        </section>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={goBack}
        className="mb-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-zblue transition hover:bg-white"
      >
        <ArrowLeft size={18} />
        Back
      </button>
      <h1 className="sr-only">Post</h1>
      {body}
    </div>
  );
}
