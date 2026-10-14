import { useEffect } from "react";

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, busy }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  let label = confirmLabel;
  if (busy) {
    label = "Deleting…";
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-navy/50 px-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="animate-toast-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-black text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={onConfirm}
            className="rounded-full bg-red-600 py-2.5 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {label}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-300 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
