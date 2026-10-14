export default function OrgLogo({ org, size = "md" }) {
  let sizeClass = "h-11 w-11 text-lg";
  if (size === "xs") {
    sizeClass = "h-5 w-5 text-[10px]";
  } else if (size === "sm") {
    sizeClass = "h-9 w-9 text-sm";
  } else if (size === "lg") {
    sizeClass = "h-24 w-24 text-3xl";
  }

  if (org.logo) {
    return (
      <img
        src={org.logo}
        alt=""
        loading="lazy"
        className={`shrink-0 rounded-full bg-white object-contain ${sizeClass}`}
      />
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-zblue/10 font-black text-zblue ${sizeClass}`}>
      {org.abbreviation.charAt(0)}
    </div>
  );
}
