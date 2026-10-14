import { Link } from "react-router-dom";
import OrgLogo from "./OrgLogo";

export default function OrgStamp({ org }) {
  return (
    <Link
      to={`/orgs/${org.slug}`}
      title={org.name}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-zblue/20 bg-zblue/5 py-0.5 pl-0.5 pr-2.5 text-xs font-bold text-zblue transition hover:border-zblue/50 hover:bg-zblue/10"
    >
      <OrgLogo org={org} size="xs" />
      <span className="truncate">{org.abbreviation}</span>
    </Link>
  );
}
