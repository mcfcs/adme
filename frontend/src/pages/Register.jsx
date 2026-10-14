import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AuthShell, { AuthButton, AuthError, AuthField } from "../components/AuthShell";

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  if (user) {
    if (justRegistered) {
      return <Navigate to="/orgs" replace />;
    }
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Passwords need at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }

    setBusy(true);
    setJustRegistered(true);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        username: username,
        email: email,
        password: password,
      });
      toast.success(`Welcome to ADME, ${firstName.trim()}!`);
    } catch (err) {
      setJustRegistered(false);
      setError(err.message);
      setBusy(false);
    }
  }

  function handleUsername(value) {
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
  }

  return (
    <AuthShell title="Create your account" subtitle="Join your orgs and see what's happening on campus.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField id="firstName" label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" placeholder="Juan" />
          <AuthField id="lastName" label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" placeholder="dela Cruz" />
        </div>
        <AuthField
          id="username"
          label="Username"
          value={username}
          onChange={handleUsername}
          autoComplete="username"
          placeholder="juandc"
          hint="3–20 characters: lowercase letters, numbers, underscores."
        />
        <AuthField id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@email.com" />
        <AuthField id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        <AuthField id="confirmPassword" label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Type it again" />
        <AuthError message={error} />
        <div className="pt-2">
          <AuthButton busy={busy} label="Create account" busyLabel="Creating account…" />
        </div>
        <p className="text-center text-sm font-semibold text-white">
          Already have an account?{" "}
          <Link to="/login" className="text-zyellow hover:underline">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
