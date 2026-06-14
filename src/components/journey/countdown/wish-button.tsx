import Link from "next/link";

/**
 * Enchanted CTA button. Adapted from a Magic MCP "AnimatedLayerButton" concept:
 * a slowly-rotating medallion sits at the left edge and, on hover, expands to
 * fill the whole button while the gold label fades into the cream interior.
 * Rebuilt for this project — raw gold/cream/navy palette, no shadcn tokens,
 * auto width so labels of any length fit.
 */
export function WishButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex min-h-13 items-center gap-3 overflow-hidden rounded-full border border-[#d6b36b]/45 bg-[#f7ead1]/[0.04] px-9 py-4 text-sm font-medium text-[#f7ead1] backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#d6b36b]/80"
      style={{ boxShadow: "0 0 0 rgba(214,179,107,0)" }}
    >
      {/* rotating starburst medallion — pinned left, grows to fill on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-7 top-1/2 h-[60px] w-[60px] -translate-y-1/2 transition-all duration-500 ease-in-out group-hover:left-0 group-hover:h-[260px] group-hover:w-full"
      >
        <svg
          viewBox="0 0 120 120"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 animate-spin-slow"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* outer glow disc */}
          <circle cx="60" cy="60" r="58" fill="#d6b36b" opacity="0.16" />
          <circle cx="60" cy="60" r="46" fill="#d6b36b" opacity="0.28" />
          {/* warm core */}
          <circle cx="60" cy="60" r="34" fill="#e7c98a" />
          {/* eight-point starburst */}
          <path
            fill="#f7ead1"
            d="M60 14 L66 54 L106 60 L66 66 L60 106 L54 66 L14 60 L54 54 Z"
          />
          <path
            fill="#fff7e6"
            opacity="0.9"
            d="M60 30 L64 56 L90 60 L64 64 L60 90 L56 64 L30 60 L56 56 Z"
            transform="rotate(45 60 60)"
          />
        </svg>
      </span>

      {/* hover glow ring around the whole button */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: "0 0 34px rgba(214,179,107,0.5)" }}
      />

      {/* label fades as the medallion sweeps across */}
      <span className="relative z-10 transition-colors duration-300 group-hover:text-[#3a2a0c]">
        {children}
      </span>
      <span
        aria-hidden
        className="relative z-10 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#3a2a0c]"
      >
        →
      </span>
    </Link>
  );
}
