import Link from "next/link";
import { Check } from "lucide-react";

/** AttendMate wordmark — indigo monogram tile + name. */
export default function Logo({
  href = "/",
  showText = true,
  className = "",
}: {
  href?: string | null;
  showText?: boolean;
  className?: string;
}) {
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-indigo-600 text-white shrink-0">
        <Check className="w-5 h-5" strokeWidth={3} />
      </span>
      {showText && (
        <span className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
          AttendMate
        </span>
      )}
    </span>
  );

  if (href === null) return inner;

  return (
    <Link href={href} aria-label="AttendMate home" className="inline-flex">
      {inner}
    </Link>
  );
}
