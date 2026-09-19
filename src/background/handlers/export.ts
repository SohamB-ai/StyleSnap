// Background Handler for Generating & Downloading Export Files and ZIP Bundles

import JSZip from "jszip";
import { MessageType, ExportFilePayload } from "../../shared/messages";
import { loadExtraction } from "../services/db";
import { generateTokensJSON, generateDesignMD, generateSkillMD, generateTailwindConfig } from "../services/exporter";

export async function handleExportFile(payload: ExportFilePayload): Promise<void> {
  const result = await loadExtraction(payload.extractionId);
  if (!result) {
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_ERROR,
      payload: { reason: "Extraction record not found." }
    });
    return;
  }

  const originSlug = new URL(result.url).hostname.replace(/\W/g, "-");
  const dateSlug = new Date(result.timestamp).toISOString().split("T")[0];

  if (payload.format === "assets-zip") {
    await exportAssetsZip(result, originSlug, dateSlug);
    return;
  }

  let content = "";
  let filename = "";
  let mimeType = "text/plain";

  switch (payload.format) {
    case "tokens-json":
      content = generateTokensJSON(result);
      filename = `stylesnap-tokens-${originSlug}-${dateSlug}.json`;
      mimeType = "application/json";
      break;
    case "design-md":
      content = generateDesignMD(result);
      filename = `DESIGN-${originSlug}-${dateSlug}.md`;
      mimeType = "text/markdown";
      break;
    case "skill-md":
      content = generateSkillMD(result);
      filename = `SKILL-${originSlug}-${dateSlug}.md`;
      mimeType = "text/markdown";
      break;
    case "tailwind-config":
      content = generateTailwindConfig(result);
      filename = `tailwind.config.${originSlug}.js`;
      mimeType = "application/javascript";
      break;
    default:
      content = generateDesignMD(result);
      filename = `stylesnap-${originSlug}-${dateSlug}.txt`;
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const reader = new FileReader();
  reader.onloadend = () => {
    const dataUrl = reader.result as string;
    chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: true
    });
  };
  reader.readAsDataURL(blob);
}

async function exportAssetsZip(result: any, originSlug: string, dateSlug: string): Promise<void> {
  const zip = new JSZip();
  const assetsFolder = zip.folder("assets")!;
  const imagesFolder = assetsFolder.folder("images")!;
  const svgsFolder = assetsFolder.folder("svgs")!;
  const iconsFolder = assetsFolder.folder("icons")!;

  // 1. Add images (fetch data if src exists)
  const images = result.assets.images || [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const indexStr = String(i + 1).padStart(3, "0");
    const ext = img.mimeType.split("/")[1] || "png";
    const name = `img-${indexStr}.${ext}`;

    try {
      if (img.src.startsWith("data:")) {
        const b64 = img.src.split(",")[1];
        imagesFolder.file(name, b64, { base64: true });
      } else {
        const res = await fetch(img.src);
        const blob = await res.blob();
        imagesFolder.file(name, blob);
      }
    } catch {
      // Skip unreachable external images
    }
  }

  // 2. Add SVGs & icons
  const svgs = result.assets.svgs || [];
  for (let i = 0; i < svgs.length; i++) {
    const svg = svgs[i];
    const indexStr = String(i + 1).padStart(3, "0");
    const name = `svg-${indexStr}.svg`;
    const targetFolder = svg.isIcon ? iconsFolder : svgsFolder;
    targetFolder.file(name, svg.svgContent);
  }

  // 3. Add Favicon if available
  if (result.assets.favicon?.dataUri) {
    const b64 = result.assets.favicon.dataUri.split(",")[1];
    assetsFolder.file("favicon.png", b64, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const reader = new FileReader();
  reader.onloadend = () => {
    const dataUrl = reader.result as string;
    chrome.downloads.download({
      url: dataUrl,
      filename: `stylesnap-assets-${originSlug}-${dateSlug}.zip`,
      saveAs: true
    });
  };
  reader.readAsDataURL(zipBlob);
}
