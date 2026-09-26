// 3-Phase Design Token Extraction Engine & Framework Detection

import {
  DesignTokens,
  ColorToken,
  ColorContext,
  SemanticGroup,
  TypographySystem,
  FontFamily,
  FontCategory,
  TypeScaleEntry,
  TypeRole,
  SpacingScale,
  SpacingValue,
  ShadowToken,
  ElevLevel,
  RadiusToken,
  RadiusLevel,
  BreakpointToken,
  FrameworkType
} from "../../../shared/types";

// Helper: HSL Proximity Clustering
interface ParsedColor {
  hex: string;
  h: number;
  s: number;
  l: number;
  a: number;
  rgbStr: string;
  hslStr: string;
}

const parsedColorCache = new Map<string, ParsedColor | null>();
let ctxCanvas: CanvasRenderingContext2D | null = null;

function parseColor(colorStr: string): ParsedColor | null {
  if (!colorStr || colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)" || colorStr === "inherit" || colorStr === "initial") {
    return null;
  }

  if (parsedColorCache.has(colorStr)) {
    return parsedColorCache.get(colorStr)!;
  }

  let r = 0, g = 0, b = 0, a = 1;

  if (colorStr.startsWith("rgb")) {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      r = parseInt(match[1], 10);
      g = parseInt(match[2], 10);
      b = parseInt(match[3], 10);
      if (match[4] !== undefined) a = parseFloat(match[4]);
    } else {
      parsedColorCache.set(colorStr, null);
      return null;
    }
  } else if (colorStr.startsWith("#")) {
    let hex = colorStr.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      parsedColorCache.set(colorStr, null);
      return null;
    }
  } else {
    // Canvas-based fallback for named colors, lab, oklch, etc.
    try {
      if (!ctxCanvas && typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        ctxCanvas = canvas.getContext("2d", { willReadFrequently: true });
      }
      if (ctxCanvas) {
        ctxCanvas.clearRect(0, 0, 1, 1);
        ctxCanvas.fillStyle = colorStr;
        ctxCanvas.fillRect(0, 0, 1, 1);
        const data = ctxCanvas.getImageData(0, 0, 1, 1).data;
        if (data[3] === 0 && colorStr !== "transparent") {
          parsedColorCache.set(colorStr, null);
          return null;
        }
        r = data[0];
        g = data[1];
        b = data[2];
        a = parseFloat((data[3] / 255).toFixed(2));
      } else {
        parsedColorCache.set(colorStr, null);
        return null;
      }
    } catch {
      parsedColorCache.set(colorStr, null);
      return null;
    }
  }

  // Convert RGB to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);
  const hexStr = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

  const res: ParsedColor = {
    hex: hexStr,
    h: hDeg,
    s: sPct,
    l: lPct,
    a,
    rgbStr: `rgb(${r}, ${g}, ${b})`,
    hslStr: `hsl(${hDeg} ${sPct}% ${lPct}%)`
  };

  parsedColorCache.set(colorStr, res);
  return res;
}


// Color Naming Heuristic
function getSuggestedColorName(parsed: ParsedColor, index: number): string {
  const { h, s, l } = parsed;
  if (l <= 8) return "Pure Black";
  if (l <= 18) return "Dark Neutral / Background";
  if (l >= 96) return "Pure White";
  if (l >= 90) return "Light Neutral / Surface";
  if (s <= 10) return l > 50 ? "Cool Gray" : "Slate Gray";

  if (h >= 345 || h < 15) return "Vibrant Red";
  if (h >= 15 && h < 45) return "Amber Orange";
  if (h >= 45 && h < 70) return "Gold Yellow";
  if (h >= 70 && h < 165) return "Emerald Green";
  if (h >= 165 && h < 200) return "Cyan Teal";
  if (h >= 200 && h < 250) return "Electric Blue";
  if (h >= 250 && h < 280) return "Indigo Accent";
  if (h >= 280 && h < 315) return "Royal Purple";
  if (h >= 315 && h < 345) return "Magenta Pink";

  return `Color ${index + 1}`;
}

// Semantic Classification
function classifySemanticGroup(parsed: ParsedColor, frequency: number, isTop: boolean): SemanticGroup {
  const { h, s, l } = parsed;
  if (s <= 12) return "neutral";
  if (h >= 120 && h <= 155 && s > 35) return "semantic-success";
  if (h >= 30 && h <= 55 && s > 45) return "semantic-warning";
  if ((h >= 345 || h <= 18) && s > 45) return "semantic-error";
  if (isTop) return "primary";
  if (frequency > 15) return "secondary";
  return "accent";
}

// Theme Summary Generator
function generateThemeSummary(colors: ColorToken[], framework: string): string {
  if (!colors.length) return "Modern web application design system.";
  
  const bgColors = colors.filter(c => c.contexts.includes("background"));
  const primaryBg = bgColors[0] || colors[0];
  const isDark = primaryBg ? (parseColor(primaryBg.hex)?.l ?? 50) < 40 : true;

  const accentColor = colors.find(c => c.semanticGroup === "primary" || c.semanticGroup === "accent") || colors[0];
  const accentName = accentColor ? accentColor.suggestedName : "accent";

  const modeStr = isDark ? "Dark mode" : "Light mode";
  const frameworkStr = framework && framework !== "unknown" && framework !== "vanilla" ? ` with ${framework}` : "";
  
  return `${modeStr} design system featuring ${accentName} palette, clean visual hierarchy${frameworkStr}.`;
}

// Phase 1: Scan Stylesheets
export function scanStylesheets(): { cssVars: Record<string, string>; breakpoints: number[]; warnings: string[] } {
  const cssVars: Record<string, string> = {};
  const breakpointsSet = new Set<number>();
  const warnings: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      warnings.push(`Cross-origin stylesheet skipped: ${sheet.href || "inline"}`);
      continue;
    }

    if (!rules) continue;

    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        if (rule.selectorText === ":root" || rule.selectorText === "*") {
          const style = rule.style;
          for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            if (prop.startsWith("--")) {
              cssVars[prop] = style.getPropertyValue(prop).trim();
            }
          }
        }
      } else if (rule instanceof CSSMediaRule && rule.conditionText) {
        const matches = rule.conditionText.match(/\d+px/g);
        if (matches) {
          matches.forEach((m) => breakpointsSet.add(parseInt(m, 10)));
        }
      }
    }
  }

  const breakpoints = Array.from(breakpointsSet).sort((a, b) => a - b);
  return { cssVars, breakpoints, warnings };
}

// Phase 2 & 3: Extract & Deduplicate Tokens
export function extractTokens(domLimit: number = 2000): { tokens: DesignTokens; warnings: string[]; framework: FrameworkType } {
  if (typeof document !== "undefined" && document.querySelectorAll("*").length < 20) {
    throw new Error("empty-dom");
  }

  const { cssVars, breakpoints: sheetBreakpoints, warnings } = scanStylesheets();

  const colorCounts = new Map<string, { parsed: ParsedColor; count: number; contexts: Set<ColorContext> }>();
  const fontMap = new Map<string, { family: string; stack: string; sizePx: number; weight: string; lh: string; ls: string; count: number }>();
  const spacingCounts = new Map<number, number>();
  const shadowCounts = new Map<string, number>();
  const radiusCounts = new Map<string, number>();
  const zIndexCounts = new Map<number, { count: number; tags: Set<string> }>();
  const letterSpacingSet = new Set<string>(["normal"]);
  const lineHeightSet = new Set<string>(["normal"]);

  const rawList = Array.from(document.querySelectorAll<HTMLElement>(
    "body, header, footer, nav, main, section, article, aside, form, button, a, h1, h2, h3, h4, h5, h6, input, textarea, select, label, table, tr, th, td, ul, ol, li, div, span, p, blockquote, figure, figcaption, code, pre"
  ));
  const elements: HTMLElement[] = [];
  const maxElements = Math.min(Math.max(domLimit || 2000, 500), 3000);

  for (const el of rawList) {
    if (elements.length >= maxElements) break;
    if (el.offsetWidth > 0 || el.offsetHeight > 0) {
      elements.push(el);
    }
  }

  let tailwindClassHits = 0;
  let styledComponentHits = 0;
  let emotionHits = 0;

  for (const el of elements) {
    const className = el.className && typeof el.className === "string" ? el.className : "";

    if (/(\bbg-|\btext-|\bp-|\bm-|\brounded-|\bflex\b|\bgrid\b)/.test(className)) {
      tailwindClassHits++;
    }
    if (className.includes("sc-")) styledComponentHits++;
    if (className.includes("css-")) emotionHits++;

    const cs = getComputedStyle(el);

    // Color extraction
    const colorProps: { prop: string; ctx: ColorContext }[] = [
      { prop: "color", ctx: "text" },
      { prop: "background-color", ctx: "background" },
      { prop: "border-color", ctx: "border" },
      { prop: "outline-color", ctx: "outline" },
      { prop: "fill", ctx: "fill" }
    ];

    for (const { prop, ctx } of colorProps) {
      const val = cs.getPropertyValue(prop);
      const parsed = parseColor(val);
      if (parsed) {
        const existing = colorCounts.get(parsed.hex);
        if (existing) {
          existing.count++;
          existing.contexts.add(ctx);
        } else {
          colorCounts.set(parsed.hex, { parsed, count: 1, contexts: new Set([ctx]) });
        }
      }
    }

    // Typography
    const familyStack = cs.fontFamily || "sans-serif";
    const familyPrimary = familyStack.split(",")[0].trim().replace(/['"]/g, "");
    const sizePx = parseFloat(cs.fontSize) || 16;
    const weight = cs.fontWeight || "400";
    const lh = cs.lineHeight && cs.lineHeight !== "normal" ? cs.lineHeight : "normal";
    const ls = cs.letterSpacing && cs.letterSpacing !== "normal" && cs.letterSpacing !== "0px" ? cs.letterSpacing : "normal";

    if (lh !== "normal") lineHeightSet.add(lh);
    if (ls !== "normal") letterSpacingSet.add(ls);

    const fontKey = `${familyPrimary}-${sizePx}-${weight}`;
    const fontEntry = fontMap.get(fontKey);
    if (fontEntry) {
      fontEntry.count++;
    } else {
      fontMap.set(fontKey, { family: familyPrimary, stack: familyStack, sizePx, weight, lh, ls, count: 1 });
    }

    // Spacing (Padding/Margin)
    const spacingProps = [
      "padding-top", "padding-right", "padding-bottom", "padding-left",
      "margin-top", "margin-right", "margin-bottom", "margin-left"
    ];
    for (const p of spacingProps) {
      const val = parseFloat(cs.getPropertyValue(p));
      if (val > 0 && val < 200) {
        spacingCounts.set(val, (spacingCounts.get(val) || 0) + 1);
      }
    }

    // Shadows & Radii
    const bs = cs.boxShadow;
    if (bs && bs !== "none") {
      shadowCounts.set(bs, (shadowCounts.get(bs) || 0) + 1);
    }

    const br = cs.borderRadius;
    if (br && br !== "0px") {
      radiusCounts.set(br, (radiusCounts.get(br) || 0) + 1);
    }

    // Z-Index extraction
    const zVal = cs.zIndex;
    if (zVal && zVal !== "auto") {
      const zNum = parseInt(zVal, 10);
      if (!isNaN(zNum) && zNum !== 0 && Math.abs(zNum) < 100000) {
        const existing = zIndexCounts.get(zNum);
        const tag = el.tagName.toLowerCase();
        if (existing) {
          existing.count++;
          existing.tags.add(tag);
        } else {
          zIndexCounts.set(zNum, { count: 1, tags: new Set([tag]) });
        }
      }
    }
  }

  // Framework Detection
  let detectedFramework: FrameworkType = "vanilla";
  
  // Tailwind v4 uses specific css variables heavily and often doesn't need a build step in the same way
  const hasTwV4Vars = Object.keys(cssVars).some(k => k.startsWith("--tw-") || k.startsWith("--spacing") || k.startsWith("--color-"));
  const hasTwClass = tailwindClassHits > 20;

  if (hasTwClass && hasTwV4Vars) detectedFramework = "tailwind-v4";
  else if (hasTwClass) detectedFramework = "tailwind";
  else if (styledComponentHits > 5) detectedFramework = "styled-components";
  else if (emotionHits > 5) detectedFramework = "emotion";
  else if (Object.keys(cssVars).length > 5) detectedFramework = "vanilla";

  // Phase 3: Normalization & Color Clustering (tolerance +-5 deg hue, +-10% sat, +-10% lightness)
  const rawColors = Array.from(colorCounts.values()).sort((a, b) => b.count - a.count);
  const colorTokens: ColorToken[] = [];
  const colorMapReverse = new Map<string, string>(); // css variable lookup

  for (const [varName, varVal] of Object.entries(cssVars)) {
    const parsed = parseColor(varVal);
    if (parsed) colorMapReverse.set(parsed.hex, varName);
  }

  let colorIdx = 0;
  for (const { parsed, count, contexts } of rawColors) {
    // Check if close to an already clustered color token (tighter tolerance: +-3 hue, +-7% sat/lightness)
    const existing = colorTokens.find((t) => {
      const p = parseColor(t.hex);
      if (!p) return false;
      return (
        Math.abs(p.h - parsed.h) <= 3 &&
        Math.abs(p.s - parsed.s) <= 7 &&
        Math.abs(p.l - parsed.l) <= 7
      );
    });

    if (existing) {
      existing.frequency += count;
      Array.from(contexts).forEach((c) => {
        if (!existing.contexts.includes(c)) existing.contexts.push(c);
      });
    } else {
      const varName = colorMapReverse.get(parsed.hex);
      const suggestedName = varName ? varName.replace(/^--/, "") : getSuggestedColorName(parsed, colorIdx);

      colorTokens.push({
        id: `col-${colorIdx + 1}`,
        value: parsed.hex,
        hex: parsed.hex,
        hsl: parsed.hslStr,
        rgb: parsed.rgbStr,
        opacity: parsed.a,
        frequency: count,
        contexts: Array.from(contexts),
        semanticGroup: classifySemanticGroup(parsed, count, colorIdx === 0),
        cssVarName: varName,
        suggestedName
      });
      colorIdx++;
    }
  }

  // Normalize Typography
  const familyGroupMap = new Map<string, { stack: string; weights: Set<number>; count: number }>();
  for (const { family, stack, weight, count } of fontMap.values()) {
    const wNum = parseInt(weight, 10) || 400;
    const existing = familyGroupMap.get(family);
    if (existing) {
      existing.count += count;
      existing.weights.add(wNum);
    } else {
      familyGroupMap.set(family, { stack, weights: new Set([wNum]), count });
    }
  }

  const families: FontFamily[] = Array.from(familyGroupMap.entries()).map(([name, data]) => {
    const category: FontCategory = name.toLowerCase().includes("mono")
      ? "monospace"
      : name.toLowerCase().includes("serif")
      ? "serif"
      : "sans-serif";
    return {
      name,
      stack: data.stack,
      category,
      weights: Array.from(data.weights).sort((a, b) => a - b),
      frequency: data.count
    };
  }).sort((a, b) => b.frequency - a.frequency);

  // Deduplicate typeScale by family, size, weight, role
  const seenTypeScale = new Set<string>();
  const typeScale: TypeScaleEntry[] = [];

  for (const { family, sizePx, weight, lh, ls, count } of Array.from(fontMap.values()).sort((a, b) => b.sizePx - a.sizePx)) {
    let role: TypeRole = "body";
    if (sizePx >= 40) role = "h1";
    else if (sizePx >= 32) role = "h2";
    else if (sizePx >= 24) role = "h3";
    else if (sizePx >= 20) role = "h4";
    else if (sizePx >= 18) role = "h5";
    else if (sizePx >= 16) role = "h6";
    else if (sizePx >= 14) role = "body";
    else if (sizePx >= 12) role = "body-sm";
    else role = "caption";

    const key = `${family}-${sizePx}-${weight}-${role}`;
    if (!seenTypeScale.has(key)) {
      seenTypeScale.add(key);
      typeScale.push({
        role,
        fontSize: `${sizePx}px`,
        fontSizePx: sizePx,
        fontWeight: weight,
        lineHeight: lh,
        letterSpacing: ls,
        fontFamily: family,
        frequency: count
      });
    }
  }

  // Normalize Spacing
  const sortedSpacing = Array.from(spacingCounts.entries()).sort((a, b) => a[0] - b[0]);
  const spacingValues: SpacingValue[] = sortedSpacing.map(([px, freq]) => ({
    px,
    rem: `${(px / 16).toFixed(2)}rem`,
    token: `space-${px}`,
    frequency: freq
  }));

  // Detect 4px / 8px grid
  const baseUnit = 4;
  const isGrid = spacingValues.every((v) => v.px % 4 === 0);

  // Normalize Shadows
  const shadowTokens: ShadowToken[] = Array.from(shadowCounts.entries()).map(([val, freq]) => {
    let level: ElevLevel = "md";
    if (val.includes("1px") || val.includes("2px")) level = "sm";
    else if (val.includes("12px") || val.includes("16px")) level = "lg";
    else if (val.includes("24px") || val.includes("32px")) level = "xl";

    return {
      value: val,
      level,
      blurPx: 8,
      spreadPx: 0,
      colorRgba: "rgba(0,0,0,0.2)",
      frequency: freq
    };
  });

  // Normalize Radii
  const radiusTokens: RadiusToken[] = Array.from(radiusCounts.entries()).map(([val, freq]) => {
    const px = parseFloat(val) || 0;
    let level: RadiusLevel = "md";
    if (val === "50%" || val === "9999px") level = "full";
    else if (px <= 4) level = "sm";
    else if (px <= 8) level = "md";
    else if (px <= 16) level = "lg";
    else level = "xl";

    return {
      value: val,
      valuePx: px,
      level,
      frequency: freq
    };
  });

  // Z-Index Tokens
  const zIndexTokens = Array.from(zIndexCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([val, data]) => ({
      value: val,
      frequency: data.count,
      contexts: Array.from(data.tags)
    }));

  // Breakpoints
  const defaultBreakpoints = [
    { px: 640, em: "40em", label: "sm" },
    { px: 768, em: "48em", label: "md" },
    { px: 1024, em: "64em", label: "lg" },
    { px: 1280, em: "80em", label: "xl" }
  ];

  const breakpointTokens: BreakpointToken[] = sheetBreakpoints.length > 0
    ? sheetBreakpoints.map((px) => ({ px, em: `${px / 16}em`, label: px >= 1200 ? "xl" : px >= 992 ? "lg" : px >= 768 ? "md" : "sm" }))
    : defaultBreakpoints;

  const themeSummary = generateThemeSummary(colorTokens, detectedFramework);

  const tokens: DesignTokens = {
    themeSummary,
    colors: colorTokens,
    typography: {
      families,
      scale: typeScale,
      lineHeights: Array.from(lineHeightSet).slice(0, 8),
      letterSpacings: Array.from(letterSpacingSet).slice(0, 8)
    },
    spacing: {
      values: spacingValues,
      baseUnit,
      isGrid,
      anomalies: []
    },
    shadows: shadowTokens,
    radii: radiusTokens,
    breakpoints: breakpointTokens,
    cssVariables: cssVars,
    zIndex: zIndexTokens
  };

  return { tokens, warnings, framework: detectedFramework };
}
