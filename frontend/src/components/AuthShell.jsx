import Logo from "./Logo";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="bg-[url('/gonzaga.jpg')] bg-cover bg-center">
      <div className="flex min-h-screen items-center justify-center bg-mist/80 px-4 py-10">
        <section className="w-full max-w-lg rounded-3xl bg-zblue px-6 py-10 shadow-2xl sm:px-12">
          <p className="text-center text-4xl">
            <Logo />
          </p>
          <h1 className="mt-4 text-center text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-center text-sm text-white/70">{subtitle}</p>
          {children}
        </section>
      </div>
    </main>
  );
}

export function AuthField({ id, label, type = "text", value, onChange, autoComplete, placeholder, hint }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-white">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-2xl bg-cream px-4 py-3 text-amber-950 shadow-lg placeholder:text-amber-950/40 focus:outline-none focus:ring-4 focus:ring-gold"
      />
      {hint && <p className="text-xs text-white/60">{hint}</p>}
    </div>
  );
}

export function AuthButton({ busy, label, busyLabel }) {
  let text = label;
  if (busy) {
    text = busyLabel;
  }
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-2xl bg-zyellow py-3 font-extrabold text-black ring-4 ring-inset ring-white transition duration-200 hover:translate-y-0.5 hover:bg-[#f2d53a] hover:shadow-lg disabled:opacity-70"
    >
      {text}
    </button>
  );
}

export function AuthError({ message }) {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="rounded-xl bg-red-100 px-3 py-2 text-center text-sm font-medium text-red-700">
      {message}
    </p>
  );
}
