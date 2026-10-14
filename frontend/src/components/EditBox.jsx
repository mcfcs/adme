import { useState } from "react";
import CharCount, { MAX_LENGTH } from "./CharCount";

export default function EditBox({ initialText, onSave, onCancel }) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  const trimmed = text.trim();
  const unchanged = trimmed === initialText.trim();
  const invalid = trimmed === "" || text.length > MAX_LENGTH;

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(trimmed);
    if (!ok) {
      setSaving(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      onCancel();
    }
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !invalid && !unchanged) {
      handleSave();
    }
  }

  let saveLabel = "Save changes";
  if (saving) {
    saveLabel = "Saving…";
  }

  return (
    <div className="mt-2">
      <label className="sr-only" htmlFor="edit-box">Edit text</label>
      <textarea
        id="edit-box"
        autoFocus
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full resize-y rounded-xl bg-cream px-4 py-3 text-[15px] text-amber-950 focus:outline-none focus:ring-2 focus:ring-zblue"
      />
      <div className="mt-2 flex items-center justify-end gap-3">
        <CharCount text={text} />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={invalid || unchanged || saving}
          onClick={handleSave}
          className="rounded-full bg-zblue px-4 py-1.5 text-sm font-bold text-white transition hover:bg-zblue-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
