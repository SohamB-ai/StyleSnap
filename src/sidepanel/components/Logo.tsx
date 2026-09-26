// StyleSnap Official Brand Logo Component — Monotone Minimal Cursor & Sparkle

import React, { useState } from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const StyleSnapLogoIcon: React.FC<LogoProps> = ({ className = "", size = 24 }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden select-none shadow-xs ${className}`}
      style={{ width: size, height: size }}
    >
      {!imgError ? (
        <img
          src="/icons/icon-48.png"
          alt="StyleSnap Logo"
          className="w-full h-full object-contain rounded-lg"
          width={size}
          height={size}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center rounded-lg"
          style={{
            background: "linear-gradient(135deg, #4338CA 0%, #3B82F6 100%)"
          }}
        >
          <svg
            width={size * 0.65}
            height={size * 0.65}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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
            <path
              d="M18 2C18 3.65685 19.3431 5 21 5C19.3431 5 18 6.34315 18 8C18 6.34315 16.6569 5 15 5C16.6569 5 18 3.65685 18 2Z"
              fill="#FAFAFA"
            />
          </svg>
        </div>
      )}
    </div>
  );
};


