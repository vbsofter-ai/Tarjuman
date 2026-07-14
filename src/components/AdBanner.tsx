"use client";

export default function AdBanner() {
  return (
    <div className="flex justify-center my-6 overflow-hidden max-w-full">
      <iframe
        src="/ad-banner.html"
        width="728"
        height="90"
        frameBorder="0"
        scrolling="no"
        style={{ border: "none", overflow: "hidden", background: "transparent" }}
        title="Adsterra 728x90 Banner"
      />
    </div>
  );
}
