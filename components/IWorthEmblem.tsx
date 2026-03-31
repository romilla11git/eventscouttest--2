"use client";

import React from 'react';

interface IWorthEmblemProps {
  /** Width & height in px */
  size?: number;
  className?: string;
}

/**
 * iWorth Technologies geometric "W" emblem.
 * A set of 3D-stacked cubes arranged as a W shape inside a thin circular ring.
 * Uses the official brand gradient: #0088CC → #33AAFF.
 */
const IWorthEmblem: React.FC<IWorthEmblemProps> = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="iWorth Technologies"
    role="img"
  >
    {/* Circular border */}
    <circle cx="40" cy="40" r="37" stroke="url(#iw-ring)" strokeWidth="2" fill="none" />

    {/* Left cube */}
    <polygon points="13,28 24,22 24,36 13,42" fill="#33AAFF" />
    <polygon points="24,22 35,28 35,42 24,36" fill="#0088CC" />
    <polygon points="13,28 24,22 35,28 24,34" fill="#55CCFF" />

    {/* Centre-left valley */}
    <polygon points="28,38 35,34 35,44 28,48" fill="#33AAFF" />
    <polygon points="35,34 42,38 42,48 35,44" fill="#0088CC" />
    <polygon points="28,38 35,34 42,38 35,42" fill="#55CCFF" />

    {/* Centre-right valley */}
    <polygon points="38,38 45,34 45,44 38,48" fill="#33AAFF" />
    <polygon points="45,34 52,38 52,48 45,44" fill="#0088CC" />
    <polygon points="38,38 45,34 52,38 45,42" fill="#55CCFF" />

    {/* Right cube */}
    <polygon points="45,28 56,22 56,36 45,42" fill="#33AAFF" />
    <polygon points="56,22 67,28 67,42 56,36" fill="#0088CC" />
    <polygon points="45,28 56,22 67,28 56,34" fill="#55CCFF" />

    <defs>
      <linearGradient id="iw-ring" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0088CC" />
        <stop offset="100%" stopColor="#33AAFF" />
      </linearGradient>
    </defs>
  </svg>
);

export default IWorthEmblem;
