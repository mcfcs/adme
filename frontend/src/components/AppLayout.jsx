import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "./Header";
import Spinner from "./Spinner";

export default function AppLayout() {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return <Spinner label="Checking your login" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
