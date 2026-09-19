// StyleSnap Official Brand Logo Component — Monotone Minimal Cursor & Sparkle

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const StyleSnapLogoIcon: React.FC<LogoProps> = ({ className = "", size = 24 }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden select-none bg-zinc-900 border border-zinc-800 shadow-2xs ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pointer Arrow Cursor */}
        <path
          d="M3 3L10.07 19.97L13.58 13.58L19.97 10.07L3 3Z"
          fill="white"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M13 13L20 20"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Monotone Sparkle Dot */}
        <path
          d="M18 2C18 3.65685 19.3431 5 21 5C19.3431 5 18 6.34315 18 8C18 6.34315 16.6569 5 15 5C16.6569 5 18 3.65685 18 2Z"
          fill="#FAFAFA"
        />
      </svg>
    </div>
  );
};


