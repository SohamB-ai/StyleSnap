// Asset Scanner (Images, Inline SVGs, CSS Backgrounds, Favicons)

import { AssetManifest, ImageAsset, SVGAsset, FaviconAsset } from "../../../shared/types";

export function scanAssets(): AssetManifest {
  const images: ImageAsset[] = [];
  const svgs: SVGAsset[] = [];
  let favicon: FaviconAsset | undefined = undefined;

  // 1. Scan <img> elements
  const imgElements = Array.from(document.querySelectorAll("img"));
  imgElements.forEach((img, i) => {
    try {
      if (!img.src || img.src.startsWith("data:image/svg+xml")) return;

      images.push({
        id: `img-${i + 1}`,
        src: img.src,
        alt: img.alt || "Image asset",
        naturalWidth: img.naturalWidth || img.clientWidth || 0,
        naturalHeight: img.naturalHeight || img.clientHeight || 0,
        type: "img",
        mimeType: img.src.endsWith(".png") ? "image/png" : img.src.endsWith(".webp") ? "image/webp" : "image/jpeg",
        srcset: img.srcset || undefined,
        sizeEstimate: 0
      });
    } catch {}
  });

  // 2. Scan inline <svg> elements
  const svgElements = Array.from(document.querySelectorAll("svg"));
  svgElements.slice(0, 50).forEach((svg, i) => {
    try {
      const rawW = parseInt(svg.getAttribute("width") || "24", 10);
      const rawH = parseInt(svg.getAttribute("height") || "24", 10);
      const width = svg.clientWidth || (isNaN(rawW) ? 24 : rawW);
      const height = svg.clientHeight || (isNaN(rawH) ? 24 : rawH);

      // Clone and sanitize paths to prevent malformed or dangling attributes
      const clone = svg.cloneNode(true) as SVGSVGElement;
      const paths = clone.querySelectorAll("path");
      paths.forEach((p) => {
        const d = p.getAttribute("d");
        if (d) {
          const trimmed = d.trim();
          if (/[,\-\sa-zA-Z]$/.test(trimmed) && !/z$/i.test(trimmed)) {
            const cleaned = trimmed.replace(/[,\-\s]+$/, "").replace(/[^0-9zZ\s]$/, "");
            p.setAttribute("d", cleaned);
          }
        }
      });

      const svgMarkup = new XMLSerializer().serializeToString(clone);

      svgs.push({
        id: `svg-${i + 1}`,
        inline: true,
        svgContent: svgMarkup,
        width,
        height,
        isIcon: width <= 48 && height <= 48
      });
    } catch {}
  });

  // 3. Scan CSS background-image (targeted selectors to avoid reflow overhead)
  const bgCandidateElements = Array.from(document.querySelectorAll<HTMLElement>(
    "header, section, main, hero, nav, [class*='bg'], [style*='background']"
  )).slice(0, 80);

  bgCandidateElements.forEach((el) => {
    try {
      const inlineBg = el.style.backgroundImage;
      const bg = inlineBg || getComputedStyle(el).backgroundImage;
      if (bg && bg.startsWith("url(") && !bg.includes("data:")) {
        const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if (match && match[1]) {
          const url = match[1];
          if (!images.some((img) => img.src === url)) {
            images.push({
              id: `bg-${images.length + 1}`,
              src: url,
              alt: "Background image",
              naturalWidth: 0,
              naturalHeight: 0,
              type: "css-background",
              mimeType: "image/png",
              sizeEstimate: 0
            });
          }
        }
      }
    } catch {}
  });

  // 4. Scan Favicon
  const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (faviconLink && faviconLink.href) {
    favicon = {
      href: faviconLink.href,
      type: faviconLink.type || "image/png",
      dataUri: faviconLink.href
    };
  } else {
    favicon = {
      href: "/favicon.ico",
      type: "image/x-icon",
      dataUri: `${window.location.origin}/favicon.ico`
    };
  }

  return {
    images,
    svgs,
    favicon,
    totalCount: images.length + svgs.length
  };
}
