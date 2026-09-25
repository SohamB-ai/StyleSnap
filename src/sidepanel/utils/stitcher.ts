// Side Panel Screenshot Stitcher (Stitches tiles via HTML5 Canvas)
// Specifications: TRD §10.2, Backend Schema §12.1 & Implementation Plan

import { StitchTilesPayload, MessageType } from "../../shared/messages";
import { ScreenshotRecord, SectionShot, ExtractionResult } from "../../shared/types";
import { saveScreenshot } from "../../background/services/db";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export async function stitchTiles(
  payload: StitchTilesPayload,
  result?: ExtractionResult | null
): Promise<ScreenshotRecord> {
  const { tiles, pageHeight } = payload;
  if (!tiles || tiles.length === 0) {
    throw new Error("No tiles provided for stitching");
  }

  // 1. Measure first tile
  const firstTileUrl = typeof tiles[0] === "string" ? tiles[0] : tiles[0].dataUrl;
  const img0 = await loadImage(firstTileUrl);
  const tileWidth = img0.naturalWidth;
  const tileHeight = img0.naturalHeight;

  // Compute canvas scale based on viewport width vs captured pixel width
  const scale = payload.viewportHeight > 0 ? tileHeight / payload.viewportHeight : 1;
  
  // Calculate total canvas height covering all tiles exactly
  let maxCoveredY = tileHeight;
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (typeof t !== "string" && typeof t.y === "number") {
      const bottom = Math.round(t.y * scale) + tileHeight;
      if (bottom > maxCoveredY) {
        maxCoveredY = bottom;
      }
    } else {
      maxCoveredY = Math.max(maxCoveredY, (i + 1) * tileHeight);
    }
  }
  // Cap at safe maximum canvas dimension (32,767px) to avoid browser crash
  const totalCanvasHeight = Math.min(32767, Math.max(tileHeight, maxCoveredY));

  // 2. Setup master canvas
  const canvas = document.createElement("canvas");
  canvas.width = tileWidth;
  canvas.height = totalCanvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create 2D canvas context");
  }

  // 3. Draw each tile onto the canvas
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const dataUrl = typeof tile === "string" ? tile : tile.dataUrl;
    if (!dataUrl) continue;

    try {
      const img = i === 0 ? img0 : await loadImage(dataUrl);

      let drawY = 0;
      if (typeof tile !== "string" && typeof tile.y === "number") {
        drawY = Math.round(tile.y * scale);
      } else if (i === tiles.length - 1 && tiles.length > 1) {
        // Last tile: position at the bottom edge to handle partial viewport scroll
        drawY = Math.max(0, totalCanvasHeight - tileHeight);
      } else {
        drawY = i * tileHeight;
      }

      ctx.drawImage(img, 0, drawY);
    } catch (err) {
      console.warn(`[StyleSnap] Tile ${i} draw warning:`, err);
    }
  }

  // 4. Generate full-page PNG Blob
  const fullPageBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to convert canvas to blob"));
    }, "image/png");
  });

  // 5. Generate Section Screenshots if sections exist in layout
  const sectionShots: SectionShot[] = [];
  const sections = result?.layout?.sections || [];

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (sec.boundingRect && sec.boundingRect.width > 0 && sec.boundingRect.height > 0) {
      try {
        const cropX = Math.max(0, Math.round(sec.boundingRect.left * scale));
        const cropY = Math.max(0, Math.round(sec.boundingRect.top * scale));
        const cropW = Math.min(canvas.width - cropX, Math.round(sec.boundingRect.width * scale));
        const cropH = Math.min(canvas.height - cropY, Math.round(sec.boundingRect.height * scale));

        if (cropW > 10 && cropH > 10) {
          const sCanvas = document.createElement("canvas");
          sCanvas.width = cropW;
          sCanvas.height = cropH;
          const sCtx = sCanvas.getContext("2d");
          if (sCtx) {
            sCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            const sBlob = await new Promise<Blob | null>((res) =>
              sCanvas.toBlob(res, "image/png")
            );
            if (sBlob) {
              sectionShots.push({
                sectionId: sec.id,
                label: sec.label,
                blob: sBlob,
                width: cropW,
                height: cropH
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Could not crop section ${sec.label}:`, err);
      }
    }
  }

  const totalSize = fullPageBlob.size + sectionShots.reduce((sum, s) => sum + s.blob.size, 0);

  const record: ScreenshotRecord = {
    id: payload.extractionId,
    fullPage: fullPageBlob,
    sections: sectionShots,
    createdAt: Date.now(),
    totalSize
  };

  // 6. Save directly to IndexedDB
  try {
    await saveScreenshot(record);
  } catch (err) {
    console.warn("Could not save screenshot directly, falling back to message:", err);
    try {
      await chrome.runtime.sendMessage({
        type: MessageType.STORE_SCREENSHOT,
        payload: record
      });
    } catch {}
  }

  return record;
}
