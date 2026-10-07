import { Fragment } from "react";

const URL_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

export function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return <>{parts.map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const trail = part.match(/[.,!?;:)\]]+$/)?.[0] ?? "";
    const url = trail ? part.slice(0, -trail.length) : part;
    const href = url.startsWith("http") ? url : `https://${url}`;
    return <Fragment key={i}><a href={href} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline underline-offset-2 hover:opacity-80">{url}</a>{trail}</Fragment>;
  })}</>;
}
