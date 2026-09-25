import { CaptureScreenshotPayload } from "../../shared/messages";

export function handleScreenshotRequest(
  payload: CaptureScreenshotPayload & { windowId?: number },
  sendResponse: (response: any) => void
): boolean {
  if (chrome.tabs && chrome.tabs.captureVisibleTab) {
    try {
      const callback = (dataUrl?: string) => {
        if (chrome.runtime.lastError) {
          console.warn("Screenshot capture warning:", chrome.runtime.lastError.message);
          sendResponse({ dataUrl: "" });
        } else {
          sendResponse({ dataUrl: dataUrl || "" });
        }
      };

      const winId = payload?.windowId;
      if (typeof winId === "number" && winId > 0) {
        chrome.tabs.captureVisibleTab(winId, { format: "png" }, callback);
      } else {
        chrome.tabs.captureVisibleTab({ format: "png" }, callback);
      }
      return true; // Keep message channel open for async response
    } catch (err) {
      console.warn("Screenshot capture exception:", err);
      sendResponse({ dataUrl: "" });
      return false;
    }
  } else {
    sendResponse({ dataUrl: "" });
    return false;
  }
}

