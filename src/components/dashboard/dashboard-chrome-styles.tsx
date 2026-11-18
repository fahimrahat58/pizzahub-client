"use client";

import { useLayoutEffect, useRef } from "react";

// The public header/footer live in the root layout. This stylesheet is owned by
// the active dashboard route, so hidden routes preserved by Cache Components
// disable it on cleanup instead of leaking the rule into the visible page.
const dashboardChromeCss = `
  body > header,
  body > footer {
    display: none !important;
  }
`;

export function DashboardChromeStyles() {
  const styleRef = useRef<HTMLStyleElement>(null);

  useLayoutEffect(() => {
    const style = styleRef.current;
    if (!style) return;
    style.media = "";
    return () => {
      style.media = "not all";
    };
  }, []);

  return <style ref={styleRef}>{dashboardChromeCss}</style>;
}
