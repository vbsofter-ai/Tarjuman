"use client";

export default function AdBanner() {
  const adHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; overflow: hidden; background: transparent;">
        <div id="ad-container" style="width: 728px; height: 90px;">
          <script type="text/javascript">
            atOptions = {
              'key' : '788e512205b7bff00057de171c9c41ec',
              'format' : 'iframe',
              'height' : 90,
              'width' : 728,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://armsbroodelusive.com/788e512205b7bff00057de171c9c41ec/invoke.js"></script>
        </div>
      </body>
    </html>
  `;

  return (
    <div className="flex justify-center my-6 overflow-hidden max-w-full">
      <iframe
        srcDoc={adHtml}
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
