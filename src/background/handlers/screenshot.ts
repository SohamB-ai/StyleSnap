import { MessageType, CaptureScreenshotPayload } from "../../shared/messages";

export function handleScreenshotRequest(
  payload: CaptureScreenshotPayload,
  sendResponse: (response: any) => void
): boolean {
  if (chrome.tabs.captureVisibleTab) {
    chrome.tabs.captureVisibleTab(
      payload.tabId > 0 ? payload.tabId : chrome.windows.WINDOW_ID_CURRENT,
      { format: "png" },
      (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error("Screenshot error:", chrome.runtime.lastError);
          sendResponse({ dataUrl: "" });
        } else {
          sendResponse({ dataUrl });
        }
      }
    );
    return true; // Keep message channel open for async response
  } else {
    sendResponse({ dataUrl: "" });
    return false;
  }
}
