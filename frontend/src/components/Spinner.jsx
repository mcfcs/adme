export default function Spinner({ label = "Loading" }) {
  return (
    <div className="flex justify-center py-10" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-mist border-t-zblue" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
