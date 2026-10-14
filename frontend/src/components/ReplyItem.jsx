import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { fullDate, timeAgo } from "../lib/time";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "./Avatar";
import ConfirmDialog from "./ConfirmDialog";
import EditBox from "./EditBox";
import ReplyComposer from "./ReplyComposer";
import RichText from "./RichText";

export default function ReplyItem({ reply, descendantCount, onAdded, onChange, onDelete }) {
  const { user } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isMine = reply.author.id === user.id;

  async function saveEdit(content) {
    try {
      const updated = await api(`/api/replies/${reply.id}`, { method: "PATCH", body: { content } });
      onChange(updated);
      setEditing(false);
      toast.success("Reply updated");
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api(`/api/replies/${reply.id}`, { method: "DELETE" });
      setConfirming(false);
      toast.success("Reply deleted");
      onDelete(reply.id);
    } catch (error) {
      toast.error(error.message);
      setDeleting(false);
    }
  }

  function handleAdded(newReply) {
    setReplying(false);
    onAdded(newReply);
  }

  let deleteMessage = "You can't undo this.";
  if (descendantCount === 1) {
    deleteMessage = "The 1 reply under it will be deleted too. You can't undo this.";
  } else if (descendantCount > 1) {
    deleteMessage = `The ${descendantCount} replies under it will be deleted too. You can't undo this.`;
  }

  return (
    <div className="flex gap-3">
      <Link to={`/u/${reply.author.username}`} aria-label={`${reply.author.first_name}'s profile`} className="relative z-10">
        <Avatar name={reply.author.first_name} size="sm" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 text-sm">
            <Link to={`/u/${reply.author.username}`} className="truncate font-bold text-slate-900 hover:underline">
              {reply.author.first_name} {reply.author.last_name}
            </Link>
            <span className="truncate text-slate-500">@{reply.author.username}</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <time dateTime={reply.created_at} title={fullDate(reply.created_at)} className="text-slate-500">
              {timeAgo(reply.created_at)}
            </time>
            {reply.updated_at && (
              <span className="text-xs italic text-slate-400" title={`Edited ${fullDate(reply.updated_at)}`}>
                edited
              </span>
            )}
          </div>

          {isMine && !editing && (
            <div className="-mr-2 -mt-1 flex shrink-0">
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit reply"
                title="Edit"
                className="rounded-full p-2 text-slate-400 transition hover:bg-zblue/10 hover:text-zblue"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label="Delete reply"
                title="Delete"
                className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {editing && <EditBox initialText={reply.content} onSave={saveEdit} onCancel={() => setEditing(false)} />}
        {!editing && (
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800">
            <RichText text={reply.content} />
          </p>
        )}

        {!editing && !replying && (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="-ml-2 mt-1 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-zblue/10 hover:text-zblue"
          >
            <MessageCircle size={14} />
            Reply
          </button>
        )}

        {replying && (
          <ReplyComposer
            postId={reply.post_id}
            parentId={reply.id}
            replyingTo={reply.author.username}
            onAdded={handleAdded}
            onCancel={() => setReplying(false)}
          />
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          title="Delete this reply?"
          message={deleteMessage}
          confirmLabel="Delete reply"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
