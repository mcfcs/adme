import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "./Avatar";
import CharCount, { MAX_LENGTH } from "./CharCount";

export default function ReplyComposer({ postId, parentId = null, replyingTo, onAdded, onCancel = null }) {
  const { user } = useAuth();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const nested = parentId !== null;
  const invalid = content.trim() === "" || content.length > MAX_LENGTH;
  const inputId = `reply-box-${parentId || "post"}`;

  async function submit(event) {
    if (event) {
      event.preventDefault();
    }
    if (invalid || sending) {
      return;
    }
    setSending(true);
    try {
      const reply = await api(`/api/posts/${postId}/replies`, {
        method: "POST",
        body: { content, parent_id: parentId },
      });
      setContent("");
      onAdded({ ...reply, just_posted: true });
      toast.success("Reply posted");
    } catch (error) {
      toast.error(error.message);
      setSending(false);
      return;
    }
    setSending(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      submit();
    }
    if (event.key === "Escape" && onCancel) {
      onCancel();
    }
  }

  let label = "Reply";
  if (sending) {
    label = "Replying…";
  }

  let formClass = "flex gap-3 p-4 sm:p-5";
  if (nested) {
    formClass = "mt-3 flex gap-3";
  }

  return (
    <form onSubmit={submit} className={formClass}>
      {!nested && <Avatar name={user.first_name} size="sm" />}
      <div className="min-w-0 flex-1">
        {nested && (
          <p className="mb-1.5 text-xs font-semibold text-slate-500">
            Replying to <span className="text-zpink">@{replyingTo}</span>
          </p>
        )}
        <label htmlFor={inputId} className="sr-only">Write a reply to @{replyingTo}</label>
        <textarea
          id={inputId}
          rows={2}
          autoFocus={nested}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Reply to @${replyingTo}`}
          className="w-full resize-none rounded-xl bg-cream px-4 py-3 text-[15px] text-amber-950 placeholder:text-amber-950/50 focus:outline-none focus:ring-2 focus:ring-zblue"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          <CharCount text={content} />
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={invalid || sending}
            className="rounded-full bg-zblue px-5 py-2 text-sm font-bold text-white transition hover:bg-zblue-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {label}
          </button>
        </div>
      </div>
    </form>
  );
}
