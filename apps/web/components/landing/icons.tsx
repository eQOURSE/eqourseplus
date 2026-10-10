import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** 24px stroke icon. Always decorative: labels live on the parent control. */
function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconArrow = (p: IconProps) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
);
export const IconArrowUpRight = (p: IconProps) => (
  <Svg {...p}><path d="M7 17 17 7M8 7h9v9" /></Svg>
);
export const IconSun = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></Svg>
);
export const IconMoon = (p: IconProps) => (
  <Svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></Svg>
);
export const IconMenu = (p: IconProps) => (
  <Svg {...p}><path d="M4 8h16M4 16h16" /></Svg>
);
export const IconClose = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const IconCheck = (p: IconProps) => (
  <Svg {...p}><path d="m5 12.5 4.2 4.2L19 7" /></Svg>
);
export const IconExpert = (p: IconProps) => (
  <Svg {...p}><circle cx="10" cy="8" r="3.5" /><path d="M3.5 20a6.5 6.5 0 0 1 13 0" /><path d="M18.5 3.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></Svg>
);
export const IconVendor = (p: IconProps) => (
  <Svg {...p}><circle cx="7" cy="9" r="2.6" /><circle cx="17" cy="9" r="2.6" /><circle cx="12" cy="6" r="2.6" /><path d="M2.5 19a4.5 4.5 0 0 1 9 0M12.5 19a4.5 4.5 0 0 1 9 0M7.5 15.5a4.5 4.5 0 0 1 9 0" /></Svg>
);
export const IconEnterprise = (p: IconProps) => (
  <Svg {...p}><path d="M4 21V5.5L12 3l8 2.5V21" /><path d="M9 21v-4h6v4M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.2" /></Svg>
);
export const IconGlobe = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Svg>
);
export const IconShield = (p: IconProps) => (
  <Svg {...p}><path d="M12 3 4.5 6v6c0 4.6 3.2 8 7.5 9 4.3-1 7.5-4.4 7.5-9V6z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></Svg>
);
export const IconSeal = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="10" r="6" /><path d="m8.5 14.8-1.5 6.2 5-2.6 5 2.6-1.5-6.2" /><path d="m9.5 10 1.7 1.7 3.3-3.4" /></Svg>
);
export const IconPlus = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);
export const IconSearch = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></Svg>
);
export const IconLanguage = (p: IconProps) => (
  <Svg {...p}><path d="M4 5h9M8.5 3v2M6 5c.6 3.4 2.6 6 5.5 7.5M11 5c-.8 4.3-3.4 7.3-7 8.5" /><path d="m12.5 21 4-9.5 4 9.5M14 17.5h5" /></Svg>
);
export const IconAtom = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="1.6" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" /></Svg>
);
export const IconCode = (p: IconProps) => (
  <Svg {...p}><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" /></Svg>
);
export const IconScale = (p: IconProps) => (
  <Svg {...p}><path d="M12 4v16M8 20h8M5 7h14M12 4l-1 3h2z" /><path d="m5 7-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" /></Svg>
);
export const IconPulse = (p: IconProps) => (
  <Svg {...p}><path d="M3 12h4l2-5 4 10 2-5h6" /></Svg>
);
export const IconBook = (p: IconProps) => (
  <Svg {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5M9 7.5h7" /></Svg>
);
export const IconRadar = (p: IconProps) => (
  <Svg {...p}><path d="M12 12 19 5" /><circle cx="12" cy="12" r="9" /><path d="M12 7a5 5 0 1 0 5 5" /><circle cx="12" cy="12" r="1.2" /></Svg>
);
export const IconRank = (p: IconProps) => (
  <Svg {...p}><path d="M4 20V11M10 20V5M16 20v-6M22 20H2" /><path d="m14 7 2-2 2 2M16 5v5" /></Svg>
);
export const IconLedger = (p: IconProps) => (
  <Svg {...p}><path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.3z" /><path d="M9 8h6M9 11.5h6M9 15h3.5" /></Svg>
);
export const IconEye = (p: IconProps) => (
  <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const IconLayers = (p: IconProps) => (
  <Svg {...p}><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></Svg>
);
export const SEGMENT_ICONS = {
  expert: IconExpert,
  vendor: IconVendor,
  enterprise: IconEnterprise,
} as const;
