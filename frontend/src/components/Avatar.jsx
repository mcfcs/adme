export default function Avatar({ name, size = "md" }) {
  let sizeClass = "h-11 w-11 text-lg";
  if (size === "sm") {
    sizeClass = "h-9 w-9 text-sm";
  } else if (size === "lg") {
    sizeClass = "h-24 w-24 text-4xl";
  }

  let letter = "?";
  if (name) {
    letter = name.charAt(0).toUpperCase();
  }

  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center rounded-full bg-gold font-black text-zblue ${sizeClass}`}
    >
      {letter}
    </div>
  );
}
