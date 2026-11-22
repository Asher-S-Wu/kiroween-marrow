export function MarrowMark({
  className = 'w-7 h-7',
  strokeColor = '#EAE6DF',
  focalColor = '#E5484D',
}: {
  className?: string;
  strokeColor?: string;
  focalColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="4" stroke={strokeColor} strokeWidth="1.25" />
      <line x1="16" y1="5.5" x2="16" y2="26.5" stroke={strokeColor} strokeWidth="1.25" />
      <path d="M9.5 10.5L16 14L22.5 10.5" stroke={strokeColor} strokeWidth="1.1" opacity="0.7" />
      <path d="M9.5 21.5L16 18L22.5 21.5" stroke={strokeColor} strokeWidth="1.1" opacity="0.7" />
      <circle cx="16" cy="16" r="3.4" fill={focalColor} />
      <circle cx="9.5" cy="10.5" r="1.7" fill={strokeColor} />
      <circle cx="22.5" cy="10.5" r="1.7" fill={strokeColor} />
      <circle cx="9.5" cy="21.5" r="1.7" fill={strokeColor} />
      <circle cx="22.5" cy="21.5" r="1.7" fill={strokeColor} />
    </svg>
  );
}
