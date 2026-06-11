"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Top-of-page progress bar that animates on every route/search-param change
 * and during the initial mount (so refreshes also show feedback).
 * Pure-CSS animation, no extra deps.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    // Start
    if (finishRef.current) clearTimeout(finishRef.current);
    if (trickleRef.current) clearInterval(trickleRef.current);
    setVisible(true);
    setProgress(firstRun.current ? 20 : 12);

    trickleRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        // Slow exponential approach to 90%
        const inc = (90 - p) * 0.08 + 1;
        return Math.min(90, p + inc);
      });
    }, 220);

    // Finish on next tick after React has rendered the new route
    const done = setTimeout(() => {
      if (trickleRef.current) clearInterval(trickleRef.current);
      setProgress(100);
      finishRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, firstRun.current ? 400 : 200);
    firstRun.current = false;

    return () => {
      clearTimeout(done);
      if (trickleRef.current) clearInterval(trickleRef.current);
      if (finishRef.current) clearTimeout(finishRef.current);
    };
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 250ms ease" }}
    >
      <div
        className="h-full bg-gradient-to-r from-accent via-accent-dark to-accent shadow-[0_0_10px_rgba(0,0,0,0.25)]"
        style={{
          width: `${progress}%`,
          transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}
