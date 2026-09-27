"use client";

import { useRouter } from "next/navigation";

/**
 * A clickable cell inside a table whose rows are already links.
 *
 * Deliberately not a `<Link>`: below `sm` ResourceTable wraps each whole card
 * in one, and an anchor inside an anchor is invalid nesting. A `role="link"`
 * span is not interactive content to the parser, so it is safe in both the
 * table and the card — it only has to stop the click reaching the row, or the
 * row's own destination wins.
 */
export default function CellLink({
  href,
  title,
  className = "",
  scroll = true,
  children,
}: {
  href: string;
  /** Worth setting: the cell text alone rarely says where it goes. */
  title?: string;
  className?: string;
  /**
   * Pass false when the destination positions itself. Next scrolls to the top
   * after navigating, which otherwise lands on top of the destination's own
   * scroll and cancels it.
   */
  scroll?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const go = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(href, { scroll });
  };

  return (
    <span
      role="link"
      tabIndex={0}
      title={title}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") go(e);
      }}
      className={`cursor-pointer font-medium hover:underline ${className}`}
      style={{ color: "#0D5C63" }}
    >
      {children}
    </span>
  );
}
