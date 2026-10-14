import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AuthShell, { AuthButton, AuthError, AuthField } from "../components/AuthShell";

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    let destination = "/";
    if (location.state && location.state.from) {
      destination = location.state.from;
    }
    return <Navigate to={destination} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back!" subtitle="Log in to see what's happening around the Ateneo.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <AuthField id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@email.com" />
        <AuthField id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="Password" />
        <AuthError message={error} />
        <div className="pt-2">
          <AuthButton busy={busy} label="Log in" busyLabel="Logging in…" />
        </div>
        <p className="text-center text-sm font-semibold text-white">
          New to ADME?{" "}
          <Link to="/register" className="text-zyellow hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
