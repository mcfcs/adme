import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, GraduationCap } from "lucide-react";
import { api } from "../lib/api";
import { joinedDate } from "../lib/time";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";
import OrgStamp from "../components/OrgStamp";
import PostFeed, { usePostFeed } from "../components/PostFeed";
import Spinner from "../components/Spinner";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Grad Student", "Alumni"];

export default function Profile() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const feed = usePostFeed(`author=${encodeURIComponent(username)}`);

  useEffect(() => {
    setData(null);
    setError("");
    setEditing(false);
    api(`/api/users/${username}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [username]);

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-mist bg-white/60 px-6 py-12 text-center">
        <p className="text-lg font-black text-zblue">{error}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-semibold text-zblue hover:underline">Back to the feed</Link>
      </div>
    );
  }

  if (!data) {
    return <Spinner label="Loading profile" />;
  }

  const { profile, orgs, is_me } = data;

  function handleSaved(updatedUser) {
    setData({ ...data, profile: { ...profile, ...updatedUser } });
    setEditing(false);
  }

  let emptyText = `@${profile.username} hasn't posted yet.`;
  if (is_me) {
    emptyText = "Your posts will show up here.";
  }

  const courseLine = [profile.course, profile.year].filter(Boolean).join(" · ");

  let postLabel = `${profile.post_count} posts`;
  if (profile.post_count === 1) {
    postLabel = "1 post";
  }

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={profile.first_name} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-slate-900">{profile.first_name} {profile.last_name}</h1>
                <p className="text-sm text-slate-500">@{profile.username}</p>
              </div>
              {is_me && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-full border border-zblue px-4 py-1.5 text-sm font-semibold text-zblue transition hover:bg-zblue hover:text-white"
                >
                  Edit profile
                </button>
              )}
            </div>

            {!editing && (
              <>
                {profile.bio && <p className="mt-3 whitespace-pre-wrap text-[15px] text-slate-700">{profile.bio}</p>}
                {!profile.bio && is_me && (
                  <p className="mt-3 text-sm italic text-slate-400">Add a bio so people know who you are.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  {courseLine && (
                    <span className="flex items-center gap-1.5"><GraduationCap size={16} /> {courseLine}</span>
                  )}
                  <span className="flex items-center gap-1.5"><CalendarDays size={16} /> Joined {joinedDate(profile.created_at)}</span>
                  <span className="font-semibold text-slate-700">{postLabel}</span>
                </div>

                {orgs.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {orgs.map((org) => <OrgStamp key={org.slug} org={org} />)}
                  </div>
                )}
              </>
            )}

            {editing && (
              <ProfileForm profile={profile} onSaved={handleSaved} onCancel={() => setEditing(false)} />
            )}
          </div>
        </div>
      </section>

      <h2 className="mt-8 mb-4 text-2xl font-extrabold text-zpink">Posts</h2>
      <PostFeed
        feed={feed}
        emptyTitle="No posts yet"
        emptyText={emptyText}
      />
    </div>
  );
}

const inputClass = "w-full rounded-xl bg-cream px-4 py-2.5 text-sm text-amber-950 focus:outline-none focus:ring-2 focus:ring-zblue";
const labelClass = "mb-1 block text-xs font-semibold text-zblue";

function ProfileForm({ profile, onSaved, onCancel }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const [fields, setFields] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    course: profile.course || "",
    year: profile.year || "",
    bio: profile.bio || "",
  });
  const [saving, setSaving] = useState(false);

  function update(name, value) {
    setFields({ ...fields, [name]: value });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await api("/api/users/me", { method: "PATCH", body: fields });
      setUser(data.user);
      onSaved(data.user);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error.message);
      setSaving(false);
    }
  }

  let saveLabel = "Save profile";
  if (saving) {
    saveLabel = "Saving…";
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className={labelClass}>First name</label>
          <input id="first_name" required value={fields.first_name} onChange={(e) => update("first_name", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="last_name" className={labelClass}>Last name</label>
          <input id="last_name" required value={fields.last_name} onChange={(e) => update("last_name", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="course" className={labelClass}>Course</label>
          <input id="course" value={fields.course} onChange={(e) => update("course", e.target.value)} placeholder="e.g. BS CS" className={inputClass} />
        </div>
        <div>
          <label htmlFor="year" className={labelClass}>Year</label>
          <select id="year" value={fields.year} onChange={(e) => update("year", e.target.value)} className={inputClass}>
            <option value="">Select year</option>
            {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="bio" className={labelClass}>Bio</label>
        <textarea id="bio" rows={3} maxLength={160} value={fields.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell people about yourself" className={`${inputClass} resize-none`} />
        <p className="mt-1 text-right text-xs text-slate-400">{160 - fields.bio.length} left</p>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-full bg-zblue px-5 py-2 text-sm font-bold text-white transition hover:bg-zblue-dark disabled:opacity-50">
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
