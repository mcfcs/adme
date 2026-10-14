export const MAX_LENGTH = 1000;

export default function CharCount({ text }) {
  const remaining = MAX_LENGTH - text.length;

  let color = "text-slate-400";
  if (remaining < 0) {
    color = "text-red-600 font-bold";
  } else if (remaining <= 100) {
    color = "text-zpink font-semibold";
  }

  return <span className={`text-xs tabular-nums ${color}`}>{remaining}</span>;
}
