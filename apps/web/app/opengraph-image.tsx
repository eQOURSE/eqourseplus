export const alt = "eQOURSE+ brand gradient";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/svg+xml";
export const dynamic = "force-static";

const socialImage = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${alt}">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#232145"/>
      <stop offset="0.58" stop-color="#0F9B8E"/>
      <stop offset="1" stop-color="#7BE8C9"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#brand)"/>
  <text x="600" y="350" fill="#F7FAF9" font-family="Inter, Arial, sans-serif" font-size="136" font-weight="800" letter-spacing="-8" text-anchor="middle">
    eQOURSE<tspan fill="#7BE8C9">+</tspan>
  </text>
</svg>`.trim();

export default function OpenGraphImage() {
  return new Response(socialImage, {
    headers: {
      "content-type": `${contentType}; charset=utf-8`,
    },
  });
}
