import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import { api } from "../lib/api";
import { resizeImage } from "../lib/image";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "./Avatar";
import CharCount, { MAX_LENGTH } from "./CharCount";
import OrgLogo from "./OrgLogo";
import OrgStamp from "./OrgStamp";

export default function PostComposer({ myOrgs = [], lockedOrg = null, onCreated }) {
  const { user } = useAuth();
  const toast = useToast();
  const fileInput = useRef(null);
  const [content, setContent] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [asOrg, setAsOrg] = useState(false);
  const [image, setImage] = useState(null);
  const [posting, setPosting] = useState(false);

  const invalid = content.trim() === "" || content.length > MAX_LENGTH;

  let selectedOrg = null;
  if (lockedOrg) {
    selectedOrg = lockedOrg;
  } else if (orgSlug !== "") {
    selectedOrg = myOrgs.find((org) => org.slug === orgSlug) || null;
  }

  const canPostAsOrg = selectedOrg !== null && selectedOrg.my_role === "admin";

  function changeOrg(slug) {
    setOrgSlug(slug);
    setAsOrg(false);
  }

  async function pickImage(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      setImage(await resizeImage(file));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function submit(event) {
    if (event) {
      event.preventDefault();
    }
    if (invalid || posting) {
      return;
    }

    let targetOrg = null;
    if (selectedOrg) {
      targetOrg = selectedOrg.slug;
    }

    setPosting(true);
    try {
      const post = await api("/api/posts", {
        method: "POST",
        body: { content, org_slug: targetOrg, as_org: canPostAsOrg && asOrg, image },
      });
      setContent("");
      setImage(null);
      onCreated({ ...post, just_posted: true });
      if (post.as_org) {
        toast.success(`Posted as ${post.org.abbreviation}`);
      } else if (post.org) {
        toast.success(`Posted in ${post.org.abbreviation}`);
      } else {
        toast.success("Posted");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPosting(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      submit();
    }
  }

  let placeholder = "What's happening on campus?";
  if (lockedOrg) {
    placeholder = `Share something with ${lockedOrg.abbreviation}…`;
  }
  if (canPostAsOrg && asOrg) {
    placeholder = `Write an announcement from ${selectedOrg.abbreviation}…`;
  }

  let buttonLabel = "Post";
  if (posting) {
    buttonLabel = "Posting…";
  }

  let avatar = <Avatar name={user.first_name} />;
  if (canPostAsOrg && asOrg) {
    avatar = <OrgLogo org={selectedOrg} />;
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {avatar}
        <div className="min-w-0 flex-1">
          <label htmlFor="composer" className="sr-only">Write a post</label>
          <textarea
            id="composer"
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full resize-y rounded-xl bg-cream px-4 py-3 text-[15px] text-amber-950 placeholder:text-amber-950/50 focus:outline-none focus:ring-2 focus:ring-zblue"
          />

          {image && (
            <div className="relative mt-3 inline-block">
              <img src={image} alt="Picture to post" className="max-h-64 rounded-xl border border-slate-200" />
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label="Remove picture"
                className="absolute right-2 top-2 rounded-full bg-navy/80 p-1.5 text-white transition hover:bg-navy"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input ref={fileInput} type="file" accept="image/*" onChange={pickImage} className="hidden" />
            <button
              type="button"
              onClick={() => fileInput.current.click()}
              aria-label="Add a picture"
              title="Add a picture"
              className="rounded-full p-2 text-zblue transition hover:bg-zblue/10"
            >
              <ImagePlus size={20} />
            </button>

            {lockedOrg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                Posting in <OrgStamp org={lockedOrg} />
              </div>
            )}

            {!lockedOrg && myOrgs.length > 0 && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                Post to
                <select
                  value={orgSlug}
                  onChange={(event) => changeOrg(event.target.value)}
                  className="max-w-44 rounded-full border border-zblue/30 bg-white px-3 py-1 text-xs font-bold text-zblue focus:outline-none focus:ring-2 focus:ring-zblue"
                >
                  <option value="">Everyone</option>
                  {myOrgs.map((org) => (
                    <option key={org.slug} value={org.slug}>{org.abbreviation}</option>
                  ))}
                </select>
              </label>
            )}

            {!lockedOrg && myOrgs.length === 0 && (
              <Link to="/orgs" className="text-xs font-semibold text-zblue hover:underline">
                Join an org to post in it
              </Link>
            )}

            {canPostAsOrg && (
              <label className="flex cursor-pointer items-center gap-2 rounded-full bg-zblue/5 px-3 py-1 text-xs font-bold text-zblue">
                <input
                  type="checkbox"
                  checked={asOrg}
                  onChange={(event) => setAsOrg(event.target.checked)}
                  className="h-3.5 w-3.5 accent-zblue"
                />
                Post as {selectedOrg.abbreviation}
              </label>
            )}

            <div className="ml-auto flex items-center gap-3">
              <CharCount text={content} />
              <button
                type="submit"
                disabled={invalid || posting}
                className="rounded-full bg-zyellow px-6 py-2 text-sm font-extrabold text-black transition hover:translate-y-0.5 hover:bg-[#f2d53a] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {buttonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
