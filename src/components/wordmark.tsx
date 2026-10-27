import Link from "next/link";

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`text-[15px] font-extrabold tracking-[0.06em] ${light ? "text-white" : "text-[#25262a]"}`}>
      NEVER86<span className="text-[#d46743]">{"\u2019D"}</span>
    </Link>
  );
}
