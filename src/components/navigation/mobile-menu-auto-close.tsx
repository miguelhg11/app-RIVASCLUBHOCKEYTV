"use client";

import { useEffect } from "react";

type MobileMenuAutoCloseProps = {
  detailsId: string;
};

export function MobileMenuAutoClose({ detailsId }: MobileMenuAutoCloseProps) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const details = document.getElementById(detailsId) as HTMLDetailsElement | null;
      if (!details || !details.open) return;

      const target = event.target;
      if (!(target instanceof Node)) return;
      if (details.contains(target)) {
        // If clicked on a link or button inside the menu, close it
        if (target instanceof Element && (target.closest("a") || target.closest("button"))) {
          setTimeout(() => {
            details.open = false;
          }, 150);
        }
        return;
      }

      // If clicked outside, close immediately unless it was the summary itself
      const summary = details.querySelector("summary");
      if (summary && summary.contains(target)) {
        return;
      }

      details.open = false;
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
    };
  }, [detailsId]);

  return null;
}
