// Background Handler for Generating & Downloading Export Files and ZIP Bundles

import JSZip from "jszip";
import { MessageType, ExportFilePayload } from "../../shared/messages";
import { loadExtraction, loadScreenshot } from "../services/db";
import {
  generateTokensJSON,
  generateDesignMD,
  generateSkillMD,
  generateTailwindConfig,
  generateTailwindV4CSS,
  generateComponentsMD,
  generateMotionMD
} from "../services/exporter";
import { generateMasterPrompt, AITool } from "../services/promptEngine";

export async function handleExportFile(payload: ExportFilePayload): Promise<void> {
  const result = await loadExtraction(payload.extractionId);
  if (!result) {
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_ERROR,
      payload: { reason: "Extraction record not found." }
    }).catch(() => {});
    return;
  }

  const originSlug = new URL(result.url).hostname.replace(/\W/g, "-");
  const dateSlug = new Date(result.timestamp).toISOString().split("T")[0];

  if (payload.format === "full-zip") {
    await exportFullZip(result, originSlug, dateSlug);
    return;
  }

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
    case "tailwind-v4-css":
      content = generateTailwindV4CSS(result);
      filename = `theme.${originSlug}.css`;
      mimeType = "text/css";
      break;
    case "components-md":
      content = generateComponentsMD(result);
      filename = `components-${originSlug}-${dateSlug}.md`;
      mimeType = "text/markdown";
      break;
    case "motion-md":
      content = generateMotionMD(result);
      filename = `MOTION-${originSlug}-${dateSlug}.md`;
      mimeType = "text/markdown";
      break;
    case "master-prompt":
      content = generateMasterPrompt(result, (payload as any).tool || "cursor");
      filename = `master-prompt-${(payload as any).tool || "cursor"}-${originSlug}-${dateSlug}.txt`;
      mimeType = "text/plain";
      break;
    default:
      content = generateDesignMD(result);
      filename = `stylesnap-${originSlug}-${dateSlug}.txt`;
      break;
  }

  const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
  chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: true
  });
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

  const base64 = await zip.generateAsync({ type: "base64", compression: "DEFLATE" });
  const dataUrl = `data:application/zip;base64,${base64}`;
  chrome.downloads.download({
    url: dataUrl,
    filename: `stylesnap-assets-${originSlug}-${dateSlug}.zip`,
    saveAs: true
  });
}

async function exportFullZip(result: any, originSlug: string, dateSlug: string): Promise<void> {
  const zip = new JSZip();

  // 1. Text & Design Documents
  zip.file("DESIGN.md", generateDesignMD(result));
  zip.file("SKILL.md", generateSkillMD(result));
  zip.file("tokens.json", generateTokensJSON(result));
  zip.file("tailwind.config.js", generateTailwindConfig(result));
  zip.file("theme.css", generateTailwindV4CSS(result));
  if (result.animations) {
    zip.file("MOTION.md", generateMotionMD(result));
  }

  // 2. Component Library (if present)
  if (result.components && result.components.length > 0) {
    zip.file("components.md", generateComponentsMD(result));
  }

  // 3. AI Master Prompts for all supported agents
  const aiTools: AITool[] = ["cursor", "claude-code", "v0", "bolt", "lovable"];
  for (const tool of aiTools) {
    zip.file(`master-prompt-${tool}.txt`, generateMasterPrompt(result, tool));
  }

  // 4. Assets Folder
  const assetsFolder = zip.folder("assets")!;
  const imagesFolder = assetsFolder.folder("images")!;
  const svgsFolder = assetsFolder.folder("svgs")!;
  const iconsFolder = assetsFolder.folder("icons")!;

  const images = result.assets?.images || [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const indexStr = String(i + 1).padStart(3, "0");
    const ext = img.mimeType?.split("/")[1] || "png";
    const slug = (img.alt ? img.alt.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) : "") || "untitled";
    const name = `img-${indexStr}-${slug}.${ext}`;

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

  const svgs = result.assets?.svgs || [];
  for (let i = 0; i < svgs.length; i++) {
    const svg = svgs[i];
    const indexStr = String(i + 1).padStart(3, "0");
    const name = `svg-${indexStr}.svg`;
    const targetFolder = svg.isIcon ? iconsFolder : svgsFolder;
    targetFolder.file(name, svg.svgContent);
  }

  if (result.assets?.favicon?.dataUri) {
    const b64 = result.assets.favicon.dataUri.split(",")[1];
    assetsFolder.file("favicon.png", b64, { base64: true });
  }

  // 5. Screenshots Folder (Load from IndexedDB)
  try {
    const screenshotRecord = await loadScreenshot(result.id);
    if (screenshotRecord) {
      const shotsFolder = zip.folder("screenshots")!;
      if (screenshotRecord.fullPage) {
        shotsFolder.file("full-page.png", screenshotRecord.fullPage);
      }
      if (screenshotRecord.sections && screenshotRecord.sections.length > 0) {
        for (let i = 0; i < screenshotRecord.sections.length; i++) {
          const s = screenshotRecord.sections[i];
          const indexStr = String(i).padStart(2, "0");
          shotsFolder.file(`section-${indexStr}-${s.label}.png`, s.blob);
        }
      }
    }
  } catch (err) {
    console.warn("Could not attach screenshots to full zip:", err);
  }

  const base64 = await zip.generateAsync({ type: "base64", compression: "DEFLATE" });
  const dataUrl = `data:application/zip;base64,${base64}`;
  chrome.downloads.download({
    url: dataUrl,
    filename: `stylesnap-${originSlug}-${dateSlug}.zip`,
    saveAs: true
  });
}

