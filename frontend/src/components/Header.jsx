import { Link, NavLink, useNavigate } from "react-router-dom";
import { House, LogOut, UsersRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "./Avatar";
import Logo from "./Logo";

function navClass({ isActive }) {
  const base = "flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition sm:px-5";
  if (isActive) {
    return `${base} bg-zyellow text-black`;
  }
  return `${base} bg-white text-zblue hover:bg-mist hover:text-navy`;
}

export default function Header() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success("Logged out. See you around campus.");
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-zblue shadow-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:h-20 sm:gap-4">
        <Link to="/" className="mr-auto text-3xl sm:text-4xl" aria-label="ADME home">
          <Logo />
        </Link>

        <nav className="flex items-center gap-2" aria-label="Main">
          <NavLink to="/" end className={navClass} aria-label="Home">
            <House size={18} />
            <span className="hidden md:inline">Home</span>
          </NavLink>
          <NavLink to="/orgs" className={navClass} aria-label="Organizations">
            <UsersRound size={18} />
            <span className="hidden md:inline">Organizations</span>
          </NavLink>
        </nav>

        <Link
          to={`/u/${user.username}`}
          className="flex items-center gap-3 rounded-full transition hover:opacity-85"
          aria-label="Your profile"
        >
          <div className="hidden flex-col items-end lg:flex">
            <span className="text-sm font-semibold leading-tight text-white">
              {user.first_name} {user.last_name}
            </span>
            <span className="text-xs text-white/60">@{user.username}</span>
          </div>
          <Avatar name={user.first_name} size="sm" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="flex h-10 items-center gap-2 rounded-full border border-white/40 px-3 text-sm font-medium text-white transition hover:bg-white/10 sm:px-4"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
