import React from "react";

type YouTubeShareButtonProps = {
  href: string;
  className?: string;
  size?: "sm" | "md";
};

export function YouTubeShareButton({ href, className = "", size = "md" }: YouTubeShareButtonProps) {
  const logoHeight = size === "sm" ? "h-5" : "h-7";

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center transition-all active:scale-[0.9] hover:opacity-85 group cursor-pointer select-none ${className}`}
      title="Compartir en YouTube"
    >
      <svg
        className={`${logoHeight} w-auto`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Curved Share Arrow in YouTube Red */}
        <path
          d="M14 9V5L22 12L14 19V15C9 15 5.5 16.6 3 20C4 15 7 10 14 9Z"
          fill="#FF0000"
          className="group-hover:scale-105 origin-center transition-transform duration-200"
        />
      </svg>
    </a>
  );
}
