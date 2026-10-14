import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { clusterName } from "../lib/clusters";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import JoinButton from "../components/JoinButton";
import OrgLogo from "../components/OrgLogo";
import PostComposer from "../components/PostComposer";
import PostFeed, { usePostFeed } from "../components/PostFeed";
import Spinner from "../components/Spinner";

export default function OrgDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const feed = usePostFeed(`org=${encodeURIComponent(slug)}`);

  useEffect(() => {
    setOrg(null);
    setError("");
    api(`/api/orgs/${slug}`)
      .then((data) => {
        setOrg(data.org);
        setMembers(data.members);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  function handleMembershipChange(updated) {
    setOrg(updated);
    if (updated.is_member) {
      const me = {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: updated.my_role,
      };
      setMembers((current) => [...current, me]);
    } else {
      setMembers((current) => current.filter((member) => member.id !== user.id));
    }
  }

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-mist bg-white/60 px-6 py-12 text-center">
        <p className="text-lg font-black text-zblue">{error}</p>
        <Link to="/orgs" className="mt-3 inline-block text-sm font-semibold text-zblue hover:underline">See all organizations</Link>
      </div>
    );
  }

  if (!org) {
    return <Spinner label="Loading organization" />;
  }

  let memberLabel = `${org.member_count} members`;
  if (org.member_count === 1) {
    memberLabel = "1 member";
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <section className="overflow-hidden rounded-2xl bg-zblue text-white shadow-lg">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="rounded-full bg-white p-1 shadow-md">
              <OrgLogo org={org} size="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-zyellow">
                {org.cluster} · {clusterName(org.cluster)}
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">{org.name}</h1>
              <p className="mt-1 text-sm text-white/70">
                {org.abbreviation} · {memberLabel} · {org.post_count} posts
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-white">
              <JoinButton org={org} onChange={handleMembershipChange} />
            </div>
          </div>
        </section>

        <div className="mt-6">
          {org.is_member && <PostComposer lockedOrg={org} onCreated={feed.addPost} />}
          {!org.is_member && (
            <p className="rounded-2xl border border-zblue/20 bg-zblue/5 px-5 py-4 text-sm text-zblue">
              <span className="font-bold">Join {org.abbreviation}</span> to post here. Anyone can read and reply. The first member of an org becomes its admin and can post as the org.
            </p>
          )}
        </div>

        <h2 className="mt-8 mb-4 text-2xl font-extrabold text-zpink">Posts in {org.abbreviation}</h2>
        <PostFeed
          feed={feed}
          emptyTitle={`No posts in ${org.abbreviation} yet`}
          emptyText="Members can post here from this page or from the home feed."
        />
      </div>

      <aside>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
          <h2 className="text-sm font-black uppercase tracking-wide text-zblue">Members ({members.length})</h2>
          {members.length === 0 && <p className="mt-2 text-sm text-slate-500">No members yet. Be the first to join.</p>}
          {members.length > 0 && (
            <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto">
              {members.map((member) => (
                <li key={member.id}>
                  <Link
                    to={`/u/${member.username}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-page"
                  >
                    <Avatar name={member.first_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{member.first_name} {member.last_name}</p>
                      <p className="truncate text-xs text-slate-500">@{member.username}</p>
                    </div>
                    {member.role === "admin" && (
                      <span className="shrink-0 rounded-md bg-zyellow px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                        Admin
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
