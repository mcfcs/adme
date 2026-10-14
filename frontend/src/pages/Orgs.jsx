import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import { clusterName } from "../lib/clusters";
import JoinButton from "../components/JoinButton";
import OrgLogo from "../components/OrgLogo";
import Spinner from "../components/Spinner";

export default function Orgs() {
  const [orgs, setOrgs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/orgs")
      .then((data) => setOrgs(data.orgs))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function replaceOrg(updated) {
    setOrgs((current) => current.map((org) => {
      if (org.slug === updated.slug) {
        return updated;
      }
      return org;
    }));
  }

  const term = search.trim().toLowerCase();
  const filtered = orgs.filter((org) => {
    return org.name.toLowerCase().includes(term) || org.abbreviation.toLowerCase().includes(term);
  });

  const groups = [];
  for (const org of filtered) {
    let group = groups.find((item) => item.cluster === org.cluster);
    if (!group) {
      group = { cluster: org.cluster, orgs: [] };
      groups.push(group);
    }
    group.orgs.push(org);
  }

  const joinedCount = orgs.filter((org) => org.is_member).length;

  let content = null;
  if (loading) {
    content = <Spinner label="Loading organizations" />;
  } else if (error) {
    content = <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">{error}</p>;
  } else if (filtered.length === 0) {
    content = (
      <div className="rounded-2xl border-2 border-dashed border-mist bg-white/60 px-6 py-12 text-center">
        <p className="text-lg font-black text-zblue">No orgs match "{search}"</p>
        <p className="mt-1 text-sm text-slate-500">Try the org's abbreviation, like "ADS" or "ZOOM".</p>
      </div>
    );
  } else {
    content = groups.map((group) => (
      <section key={group.cluster} className="mb-10">
        <h2 className="text-lg font-black uppercase tracking-wide text-zblue">{group.cluster}</h2>
        <p className="mb-4 text-sm text-slate-500">{clusterName(group.cluster)} · {group.orgs.length} orgs</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {group.orgs.map((org) => (
            <OrgCard key={org.slug} org={org} onChange={replaceOrg} />
          ))}
        </div>
      </section>
    ));
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-zpink sm:text-5xl">Organizations</h1>
      <p className="mt-1 mb-6 text-slate-500">
        {orgs.length} Ateneo orgs · you're in {joinedCount}
      </p>

      <div className="relative mb-8 max-w-md">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-950/50" />
        <label htmlFor="org-search" className="sr-only">Search organizations</label>
        <input
          id="org-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search organizations…"
          className="w-full rounded-xl bg-cream py-2.5 pl-11 pr-4 text-amber-950 placeholder:text-amber-950/50 focus:outline-none focus:ring-2 focus:ring-zblue"
        />
      </div>

      {content}
    </div>
  );
}

function OrgCard({ org, onChange }) {
  let members = `${org.member_count} members`;
  if (org.member_count === 1) {
    members = "1 member";
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md">
      <Link to={`/orgs/${org.slug}`} className="flex flex-col items-center gap-2">
        <OrgLogo org={org} size="lg" />
        <p className="text-sm font-bold leading-tight text-zblue">{org.abbreviation}</p>
        <p className="line-clamp-2 text-xs leading-snug text-slate-500">{org.name}</p>
      </Link>
      <p className="mt-auto text-xs text-slate-400">{members}</p>
      <JoinButton org={org} onChange={onChange} size="sm" />
    </div>
  );
}
