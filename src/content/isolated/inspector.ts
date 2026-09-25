// Element Inspector On-Page Hover Overlay & Click Selector

import { MessageType } from "../../shared/messages";
import { sanitizeComponentHTML } from "./extractor/components";

let overlayEl: HTMLDivElement | null = null;
let isActive = false;

function createOverlay(): HTMLDivElement {
  if (overlayEl) return overlayEl;
  const div = document.createElement("div");
  div.id = "stylesnap-inspector-overlay";
  div.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483647;
    border: 2px solid #4F46E5;
    background: rgba(79, 70, 229, 0.1);
    transition: all 0.08s ease;
    display: none;
    box-sizing: border-box;
    border-radius: 4px;
  `;
  document.body.appendChild(div);
  overlayEl = div;
  return div;
}

function extractRelevantCSS(el: HTMLElement): string {
  const cs = getComputedStyle(el);
  const relevantProps = [
    "display",
    "position",
    "flex-direction",
    "grid-template-columns",
    "gap",
    "color",
    "background-color",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "padding",
    "margin",
    "border-radius",
    "border",
    "box-shadow"
  ];

  let cssBlock = "";
  for (const prop of relevantProps) {
    const val = cs.getPropertyValue(prop);
    if (val && val !== "none" && val !== "normal" && val !== "rgba(0, 0, 0, 0)" && val !== "0px") {
      cssBlock += `  ${prop}: ${val};\n`;
    }
  }
  return cssBlock;
}

function generateCSSSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  if (el.className && typeof el.className === "string") {
    const classes = el.className.trim().split(/\s+/).join(".");
    if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
  }
  return el.tagName.toLowerCase();
}

function handleMouseOver(e: MouseEvent) {
  if (!isActive || !overlayEl) return;
  const target = e.target as HTMLElement;
  if (!target || target === overlayEl) return;

  const rect = target.getBoundingClientRect();
  overlayEl.style.top = `${rect.top}px`;
  overlayEl.style.left = `${rect.left}px`;
  overlayEl.style.width = `${rect.width}px`;
  overlayEl.style.height = `${rect.height}px`;
  overlayEl.style.display = "block";
}

function handleClick(e: MouseEvent) {
  if (!isActive) return;
  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  if (!target || target === overlayEl) return;

  const css = extractRelevantCSS(target);
  const selector = generateCSSSelector(target);
  const html = sanitizeComponentHTML(target, 2000);
  const rect = target.getBoundingClientRect();

  chrome.runtime.sendMessage({
    type: MessageType.ELEMENT_SELECTED,
    payload: {
      tagName: target.tagName.toLowerCase(),
      html,
      css,
      boundingBox: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      selector
    }
  }).catch(() => {});

  deactivateInspector();
}

export function activateInspector() {
  isActive = true;
  const overlay = createOverlay();
  overlay.style.display = "none";
  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("click", handleClick, true);
}

export function deactivateInspector() {
  isActive = false;
  if (overlayEl) overlayEl.style.display = "none";
  document.removeEventListener("mouseover", handleMouseOver, true);
  document.removeEventListener("click", handleClick, true);
}
