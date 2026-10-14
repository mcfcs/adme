import { Link } from "react-router-dom";

const TOKENS = /((?<![A-Za-z0-9_.])@[A-Za-z0-9_]{3,20})|((?:https?:\/\/|www\.|tinyurl\.com\/|bit\.ly\/|forms\.gle\/)\S+)/g;

function splitTrailingPunctuation(url) {
  let end = url.length;
  while (end > 0 && ".,!?)".includes(url[end - 1])) {
    end -= 1;
  }
  return [url.slice(0, end), url.slice(end)];
}

export default function RichText({ text }) {
  const pieces = [];
  let last = 0;

  for (const match of text.matchAll(TOKENS)) {
    pieces.push(text.slice(last, match.index));

    if (match[1]) {
      const username = match[1].slice(1).toLowerCase();
      pieces.push(
        <Link key={match.index} to={`/u/${username}`} className="font-semibold text-zpink hover:underline">
          {match[1]}
        </Link>,
      );
    } else {
      const [url, trailing] = splitTrailingPunctuation(match[2]);
      let href = url;
      if (!url.startsWith("http")) {
        href = `https://${url}`;
      }
      pieces.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-zblue underline decoration-zblue/30 underline-offset-2 hover:decoration-zblue"
        >
          {url}
        </a>,
      );
      pieces.push(trailing);
    }

    last = match.index + match[0].length;
  }

  pieces.push(text.slice(last));
  return pieces;
}
