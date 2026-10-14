import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import OrgLogo from "./OrgLogo";

export function useMyOrgs() {
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    api("/api/me/orgs")
      .then((data) => setOrgs(data.orgs))
      .catch(() => setOrgs([]));
  }, []);

  return orgs;
}

export default function MyOrgsPanel({ orgs }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-wide text-zblue">Your orgs</h2>

      {orgs.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">
          You haven't joined any orgs yet. Join one to post in it and see its updates under My orgs.
        </p>
      )}

      {orgs.length > 0 && (
        <ul className="mt-3 space-y-1">
          {orgs.map((org) => (
            <li key={org.slug}>
              <Link
                to={`/orgs/${org.slug}`}
                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-page"
              >
                <OrgLogo org={org} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{org.abbreviation}</p>
                  <p className="truncate text-xs text-slate-500">{org.name}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/orgs"
        className="mt-4 flex justify-center rounded-full bg-zyellow py-2 text-sm font-extrabold text-black transition hover:bg-[#f2d53a]"
      >
        Find orgs to join
      </Link>
    </section>
  );
}
