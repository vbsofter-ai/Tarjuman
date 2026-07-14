"use client";

import { useEffect, useRef } from "react";

export default function AdBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on the client side
    if (typeof window !== "undefined" && bannerRef.current && !bannerRef.current.firstChild) {
      try {
        const confScript = document.createElement("script");
        confScript.type = "text/javascript";
        confScript.innerHTML = `
          atOptions = {
            'key' : '788e512205b7bff00057de171c9c41ec',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        `;
        bannerRef.current.appendChild(confScript);

        const loadScript = document.createElement("script");
        loadScript.type = "text/javascript";
        loadScript.src = "https://armsbroodelusive.com/788e512205b7bff00057de171c9c41ec/invoke.js";
        bannerRef.current.appendChild(loadScript);
      } catch (err) {
        console.error("Adsterra loading error:", err);
      }
    }
  }, []);

  return (
    <div className="flex justify-center my-6 overflow-hidden max-w-full">
      <div ref={bannerRef} className="bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center" style={{ width: "728px", height: "90px" }} />
    </div>
  );
}
