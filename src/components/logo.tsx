"use client";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-mark ${className || ""}`}
    >
      <path
        d="M 100 200 L 150 60 L 200 60 L 150 200 Z M 300 200 L 250 60 L 200 60 L 250 200 Z M 175 120 L 225 120 L 225 300 L 175 300 Z M 80 200 L 320 200 L 280 250 L 120 250 Z"
        fillRule="evenodd"
      />
    </svg>
  );
}
