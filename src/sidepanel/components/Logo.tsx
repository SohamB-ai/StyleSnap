// StyleSnap Official Brand Logo Component

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const StyleSnapLogoIcon: React.FC<LogoProps> = ({ className = "", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 175 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect width="175" height="175" rx="32" fill="#1E1B4B" />
      <rect x="0" y="0" width="175" height="88" rx="32" fill="#252259" opacity="0.4" />
      <path
        d="M 130,37 C 130,22 112,16 90,16 C 65,16 45,28 45,49 C 45,70 65,80 90,89 C 115,98 135,110 135,129 C 135,150 115,158 90,158 C 65,158 47,147 47,135"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="90" cy="88" r="6" fill="#6366F1" />
      <line x1="90" y1="80" x2="90" y2="73" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="90" y1="96" x2="90" y2="103" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="82" y1="88" x2="75" y2="88" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="98" y1="88" x2="105" y2="88" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};
