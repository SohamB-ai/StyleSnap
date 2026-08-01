// Asset Scanner (Images, Inline SVGs, CSS Backgrounds, Favicons)

import { AssetManifest, ImageAsset, SVGAsset, FaviconAsset } from "../../../shared/types";

export function scanAssets(): AssetManifest {
  const images: ImageAsset[] = [];
  const svgs: SVGAsset[] = [];
  let favicon: FaviconAsset | undefined = undefined;

  // 1. Scan <img> elements
  const imgElements = Array.from(document.querySelectorAll("img"));
  imgElements.forEach((img, i) => {
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
  });

  // 2. Scan inline <svg> elements
  const svgElements = Array.from(document.querySelectorAll("svg"));
  svgElements.slice(0, 50).forEach((svg, i) => {
    const width = svg.clientWidth || parseInt(svg.getAttribute("width") || "24", 10);
    const height = svg.clientHeight || parseInt(svg.getAttribute("height") || "24", 10);
    const svgMarkup = new XMLSerializer().serializeToString(svg);

    svgs.push({
      id: `svg-${i + 1}`,
      inline: true,
      svgContent: svgMarkup,
      width,
      height,
      isIcon: width <= 48 && height <= 48
    });
  });

  // 3. Scan CSS background-image
  const bgElements = Array.from(document.querySelectorAll("*")).slice(0, 500);
  bgElements.forEach((el) => {
    const bg = getComputedStyle(el).backgroundImage;
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
