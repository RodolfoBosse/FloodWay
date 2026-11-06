import React, { useEffect, useRef } from "react";

export default function GoogleAdSenseBlock({ slotId = null, format = "auto", responsive = true, className = "" }) {
  const adRef = useRef(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!pushedRef.current) {
      try {
        if (typeof window !== "undefined") {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          pushedRef.current = true;
        }
      } catch (err) {
        console.debug("AdSense push:", err);
      }
    }
  }, []);

  return (
    <div className={`my-6 p-3 bg-gray-50/80 rounded-xl border border-gray-200 text-center overflow-hidden ${className}`}>
      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-2">Publicidade</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3566074526946852"
        data-ad-slot={slotId || undefined}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
