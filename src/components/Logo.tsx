/**
 * Essist Capital logo — SVG recreation of the official shield mark.
 *
 * Usage:
 *   <Logo />              — icon + wordmark (default, for header)
 *   <Logo size="lg" />    — larger version
 *   <Logo iconOnly />     — shield only (favicons, small spaces)
 *   <Logo light={false} /> — dark wordmark (for light backgrounds)
 */

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  iconOnly?: boolean;
  /** true = white wordmark (dark bg), false = navy wordmark (light bg) */
  light?: boolean;
  className?: string;
}

const SIZES = {
  sm: { icon: 28, text1: 13, text2: 8, gap: 8 },
  md: { icon: 36, text1: 17, text2: 10, gap: 10 },
  lg: { icon: 56, text1: 26, text2: 14, gap: 14 },
  xl: { icon: 80, text1: 36, text2: 18, gap: 18 },
};

/** The shield icon SVG — faithfully recreated */
export const LogoIcon = ({ size = 36 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Shield outline (white inner border effect) */}
    <path
      d="M50 4 L88 18 L88 52 C88 74 72 92 50 102 C28 92 12 74 12 52 L12 18 Z"
      fill="white"
    />
    {/* Shield navy fill */}
    <path
      d="M50 10 L82 22 L82 52 C82 71 68 87 50 97 C32 87 18 71 18 52 L18 22 Z"
      fill="#0d1f1e"
    />

    {/* Gold trend arrow — goes from lower-left, dips to roof peak, rises to top-right */}
    {/* Base line: left shoulder → roof left slope → roof peak → up-right exit */}
    <path
      d="M22 62 L36 46 L50 58 L74 28"
      stroke="#0d9488"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Arrow head */}
    <path
      d="M68 22 L82 26 L78 40"
      stroke="#0d9488"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* House body (lower portion of shield) */}
    <path
      d="M34 62 L34 80 L66 80 L66 62 L50 50 Z"
      fill="#0d1f1e"
    />
    {/* House roof ridge highlight */}
    <path
      d="M34 62 L50 50 L66 62"
      stroke="white"
      strokeWidth="1.5"
      fill="none"
      opacity="0.3"
    />
    {/* Window */}
    <rect x="43" y="65" width="14" height="14" rx="1" fill="white" opacity="0.9" />
    <line x1="50" y1="65" x2="50" y2="79" stroke="#0d1f1e" strokeWidth="1.5" />
    <line x1="43" y1="72" x2="57" y2="72" stroke="#0d1f1e" strokeWidth="1.5" />
  </svg>
);

/** Full logo: icon + wordmark */
const Logo = ({
  size = "md",
  iconOnly = false,
  light = true,
  className = "",
}: LogoProps) => {
  const s = SIZES[size];
  const navyColor = light ? "#ffffff" : "#0d1f1e";
  const goldColor = "#0d9488";

  if (iconOnly) return <LogoIcon size={s.icon} />;

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: s.gap }}
    >
      <LogoIcon size={s.icon} />
      <div className="flex flex-col leading-none">
        <span
          style={{
            fontSize: s.text1,
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: navyColor,
            fontFamily: "serif",
            lineHeight: 1,
          }}
        >
          ESSIST
        </span>
        <span
          style={{
            fontSize: s.text2,
            fontWeight: 600,
            letterSpacing: "0.22em",
            color: goldColor,
            fontFamily: "sans-serif",
            lineHeight: 1,
            marginTop: 3,
          }}
        >
          — CAPITAL —
        </span>
      </div>
    </div>
  );
};

export default Logo;
