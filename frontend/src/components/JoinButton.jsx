import { useState } from "react";
import { Check } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../context/ToastContext";

export default function JoinButton({ org, onChange, size = "md" }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      let updated;
      if (org.is_member) {
        updated = await api(`/api/orgs/${org.slug}/membership`, { method: "DELETE" });
        toast.success(`You left ${org.abbreviation}`);
      } else {
        updated = await api(`/api/orgs/${org.slug}/membership`, { method: "POST" });
        if (updated.my_role === "admin") {
          toast.success(`You joined ${org.abbreviation} as its first admin`);
        } else {
          toast.success(`You joined ${org.abbreviation}`);
        }
      }
      onChange(updated);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  let sizeClass = "px-5 py-2 text-sm";
  if (size === "sm") {
    sizeClass = "px-4 py-1.5 text-xs";
  }

  if (org.is_member) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        aria-label={`Leave ${org.abbreviation}`}
        className={`group flex items-center justify-center gap-1.5 rounded-full border border-zblue font-bold text-zblue transition hover:border-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 ${sizeClass}`}
      >
        <Check size={14} className="group-hover:hidden" />
        <span className="group-hover:hidden">Joined</span>
        <span className="hidden group-hover:inline">Leave</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      className={`rounded-full bg-zyellow font-extrabold text-black transition hover:bg-[#f2d53a] disabled:opacity-50 ${sizeClass}`}
    >
      Join
    </button>
  );
}
