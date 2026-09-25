// Screenshot Driver — Dead-Simple Greedy Scroll & Capture
// No complex container detection. Force everything to window-scroll.
// Scroll down one viewport at a time until the page refuses to move.

import {
  MessageType,
  ScreenshotResponsePayload,
  StitchTilesPayload,
  ScreenshotTilePayload,
  ScreenshotTileInfo
} from "../../shared/messages";

const TAG = "[StyleSnap Screenshot]";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Capture a single tile by asking the service worker to call captureVisibleTab.
 * Retries once on failure.
 */
async function captureTile(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res: ScreenshotResponsePayload = await chrome.runtime.sendMessage({
        type: MessageType.CAPTURE_SCREENSHOT,
        payload: { tabId: 0 }
      });
      if (res?.dataUrl) return res.dataUrl;
    } catch (err) {
      console.warn(`${TAG} captureTile attempt ${attempt} failed:`, err);
    }
    await sleep(200);
  }
  return "";
}

/**
 * Hide sticky/fixed elements so they don't repeat in every tile.
 * Returns a restore function.
 */
function hideStickyElements(): () => void {
  const saved: Array<{ el: HTMLElement; vis: string }> = [];
  try {
    const all = document.querySelectorAll("*");
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement;
      if (!el || !el.style) continue;
      try {
        const cs = window.getComputedStyle(el);
        if (cs.position === "fixed" || cs.position === "sticky") {
          const rect = el.getBoundingClientRect();
          // Only hide small fixed elements (navbars, headers, FABs) — not full-screen overlays
          if (rect.height > 0 && rect.height < window.innerHeight * 0.7) {
            saved.push({ el, vis: el.style.visibility });
            el.style.visibility = "hidden";
          }
        }
      } catch {}
    }
  } catch {}
  console.log(`${TAG} Hid ${saved.length} sticky/fixed elements`);
  return () => {
    for (const { el, vis } of saved) {
      el.style.visibility = vis;
    }
  };
}

export async function captureFullPageScreenshots(extractionId: string): Promise<void> {
  console.log(`${TAG} ===== STARTING FULL-PAGE CAPTURE =====`);

  const docEl = document.documentElement;
  const body = document.body;

  // Save original state
  const savedScrollX = window.scrollX;
  const savedScrollY = window.scrollY;
  const savedHtmlOverflow = docEl.style.overflow;
  const savedHtmlOverflowY = docEl.style.overflowY;
  const savedBodyOverflow = body ? body.style.overflow : "";
  const savedBodyOverflowY = body ? body.style.overflowY : "";
  const savedHtmlScrollBehavior = docEl.style.scrollBehavior;
  const savedBodyScrollBehavior = body ? body.style.scrollBehavior : "";

  // Inject stylesheet to hide scrollbars and force instant scrolling
  const styleEl = document.createElement("style");
  styleEl.id = "__stylesnap_capture_style";
  styleEl.textContent = `
    ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    * {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      scroll-behavior: auto !important;
    }
  `;
  document.head.appendChild(styleEl);

  // Force html and body to be scrollable and instant
  docEl.style.overflow = "visible";
  docEl.style.overflowY = "visible";
  docEl.style.scrollBehavior = "auto";
  if (body) {
    body.style.overflow = "visible";
    body.style.overflowY = "visible";
    body.style.scrollBehavior = "auto";
  }

  const viewportHeight = window.innerHeight;
  console.log(`${TAG} Viewport height: ${viewportHeight}px`);

  let restoreSticky: (() => void) | null = null;

  try {
    // Step 1: Force scroll to absolute top
    window.scrollTo(0, 0);
    if (body) body.scrollTop = 0;
    docEl.scrollTop = 0;
    await sleep(500);
    console.log(`${TAG} Scrolled to top. window.scrollY = ${window.scrollY}`);

    const tiles: ScreenshotTileInfo[] = [];
    const MAX_TILES = 80;

    for (let tileIndex = 0; tileIndex < MAX_TILES; tileIndex++) {
      const yBefore = window.scrollY;
      console.log(`${TAG} Tile ${tileIndex}: capturing at Y=${yBefore}`);

      // Step 2: Capture the currently visible viewport
      const dataUrl = await captureTile();
      if (!dataUrl) {
        console.warn(`${TAG} Tile ${tileIndex}: empty dataUrl, skipping`);
        continue;
      }

      tiles.push({ dataUrl, y: yBefore });

      // Notify side panel of progress
      try {
        const msg: ScreenshotTilePayload = {
          extractionId,
          dataUrl,
          tileIndex,
          totalTiles: Math.max(tileIndex + 2, 5)
        };
        chrome.runtime.sendMessage({ type: MessageType.SCREENSHOT_TILE, payload: msg }).catch(() => {});
      } catch {}

      // Step 3: After first tile, hide sticky elements
      if (tileIndex === 0) {
        restoreSticky = hideStickyElements();
      }

      // Step 4: Scroll down by one full viewport height
      const targetY = yBefore + viewportHeight;
      window.scrollTo(0, targetY);
      // Also try body/docEl for maximum compatibility
      docEl.scrollTop = targetY;
      if (body) body.scrollTop = targetY;

      // Step 5: Wait for rendering
      await sleep(500);

      // Step 6: Check where we actually ended up
      const yAfter = window.scrollY;
      console.log(`${TAG} Tile ${tileIndex}: scrolled from ${yBefore} -> target ${targetY} -> actual ${yAfter}`);

      // If the page didn't move (or moved less than 3px), we've hit the bottom
      if (yAfter <= yBefore + 2) {
        console.log(`${TAG} ✅ Reached bottom of page at Y=${yAfter}. Total tiles: ${tiles.length}`);
        break;
      }
    }

    console.log(`${TAG} Capture complete. ${tiles.length} tiles captured.`);

    // Step 7: Restore everything
    if (restoreSticky) restoreSticky();

    docEl.style.overflow = savedHtmlOverflow;
    docEl.style.overflowY = savedHtmlOverflowY;
    docEl.style.scrollBehavior = savedHtmlScrollBehavior;
    if (body) {
      body.style.overflow = savedBodyOverflow;
      body.style.overflowY = savedBodyOverflowY;
      body.style.scrollBehavior = savedBodyScrollBehavior;
    }
    window.scrollTo(savedScrollX, savedScrollY);

    // Step 8: Send tiles to side panel for stitching
    if (tiles.length > 0) {
      const lastTile = tiles[tiles.length - 1];
      const totalHeight = (lastTile.y ?? 0) + viewportHeight;

      const stitchPayload: StitchTilesPayload = {
        extractionId,
        tiles,
        pageHeight: totalHeight,
        viewportHeight
      };

      console.log(`${TAG} Sending ${tiles.length} tiles for stitching. Estimated page height: ${totalHeight}px`);

      chrome.runtime.sendMessage({
        type: MessageType.STITCH_TILES,
        payload: stitchPayload
      }).catch((err) => {
        console.error(`${TAG} Failed to send STITCH_TILES:`, err);
      });
    } else {
      console.error(`${TAG} No tiles captured! Something went wrong.`);
    }
  } catch (err) {
    console.error(`${TAG} FATAL ERROR:`, err);

    // Restore on error
    if (restoreSticky) restoreSticky();
    docEl.style.overflow = savedHtmlOverflow;
    docEl.style.overflowY = savedHtmlOverflowY;
    docEl.style.scrollBehavior = savedHtmlScrollBehavior;
    if (body) {
      body.style.overflow = savedBodyOverflow;
      body.style.overflowY = savedBodyOverflowY;
      body.style.scrollBehavior = savedBodyScrollBehavior;
    }
    window.scrollTo(savedScrollX, savedScrollY);
  } finally {
    // Remove injected style
    const injected = document.getElementById("__stylesnap_capture_style");
    if (injected) injected.remove();
    console.log(`${TAG} ===== CAPTURE FINISHED =====`);
  }
}
