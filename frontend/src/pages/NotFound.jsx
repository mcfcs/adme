import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-7xl font-black text-zblue">4<span className="text-gold">0</span>4</p>
      <h1 className="mt-4 text-2xl font-extrabold text-zpink">This page isn't on campus.</h1>
      <p className="mt-1 text-slate-500">The link may be broken, or the page was removed.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-zyellow px-6 py-2.5 font-extrabold text-black transition hover:bg-[#f2d53a]">
        Go to the feed
      </Link>
    </div>
  );
}
