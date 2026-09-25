// StyleSnap Data Models & System Schemas

export type FrameworkType =
  | "vanilla"
  | "tailwind"
  | "tailwind-v4"
  | "css-in-js"
  | "styled-components"
  | "emotion"
  | "unknown";

export interface ColorToken {
  id: string; // UUID v4
  value: string; // Normalized hex: "#4F46E5"
  hex: string; // Same as value
  hsl: string; // "hsl(243 75% 59%)"
  rgb: string; // "rgb(79, 70, 229)"
  opacity: number; // 0–1
  frequency: number; // DOM count
  contexts: ColorContext[];
  semanticGroup: SemanticGroup;
  cssVarName?: string; // e.g., "--color-primary"
  suggestedName: string; // Auto-named or variable-based
}

export type ColorContext = "background" | "text" | "border" | "fill" | "outline" | "shadow";
export type SemanticGroup =
  | "primary"
  | "secondary"
  | "accent"
  | "neutral"
  | "semantic-success"
  | "semantic-warning"
  | "semantic-error"
  | "surface"
  | "unknown";

export interface TypographySystem {
  families: FontFamily[];
  scale: TypeScaleEntry[];
  lineHeights: string[];
  letterSpacings: string[];
}

export interface FontFamily {
  name: string; // Cleaned family name e.g. "Inter"
  stack: string; // Full stack e.g. "Inter, system-ui, sans-serif"
  category: FontCategory;
  weights: number[]; // [400, 500, 600, 700]
  frequency: number;
}

export type FontCategory = "sans-serif" | "serif" | "monospace" | "display" | "unknown";

export interface TypeScaleEntry {
  role: TypeRole;
  fontSize: string; // "3rem" or "48px"
  fontSizePx: number; // 48
  fontWeight: string; // "700"
  lineHeight: string; // "1.2" or "57.6px"
  letterSpacing: string;
  fontFamily: string;
  frequency: number;
}

export type TypeRole =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "body"
  | "body-sm"
  | "caption"
  | "micro"
  | "code"
  | "label"
  | "unknown";

export interface SpacingScale {
  values: SpacingValue[];
  baseUnit: number; // e.g. 4
  isGrid: boolean;
  anomalies: number[];
}

export interface SpacingValue {
  px: number;
  rem: string;
  token: string; // "space-4"
  frequency: number;
}

export interface ShadowToken {
  value: string;
  level: ElevLevel;
  blurPx: number;
  spreadPx: number;
  colorRgba: string;
  frequency: number;
}

export type ElevLevel = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface RadiusToken {
  value: string;
  valuePx: number;
  level: RadiusLevel;
  frequency: number;
}

export type RadiusLevel = "none" | "sm" | "md" | "lg" | "xl" | "full";

export interface BreakpointToken {
  px: number;
  em: string;
  label: string; // "sm", "md", "lg", "xl"
}

export interface ZIndexToken {
  value: number;
  frequency: number;
  contexts: string[];
}

export interface DesignTokens {
  themeSummary?: string;
  colors: ColorToken[];
  typography: TypographySystem;
  spacing: SpacingScale;
  shadows: ShadowToken[];
  radii: RadiusToken[];
  breakpoints: BreakpointToken[];
  cssVariables: Record<string, string>;
  zIndex: ZIndexToken[];
}

// ── V2 Layout Structure ──────────────────────────────
export interface LayoutStructure {
  maxContentWidth: string;     // "1280px" | "90vw"
  baseGrid: GridInfo;
  sections: PageSection[];
}

export interface GridInfo {
  type: "css-grid" | "flexbox" | "mixed" | "unknown";
  columns?: string;   // "repeat(12, 1fr)"
  gap?: string;
  columnCount: number;
}

export type SectionLabel = "navigation" | "hero" | "features" | "testimonials" 
  | "pricing" | "cta" | "footer" | "sidebar" | "content" | "gallery" 
  | "faq" | "team" | "stats" | "unknown";

export interface PageSection {
  id: string;
  label: SectionLabel;
  tagName: string;
  layoutType: "flex" | "grid" | "block" | "absolute" | "mixed";
  flexDirection?: string;
  flexWrap?: string;
  gridCols?: string;
  gap?: string;
  padding: string;
  backgroundColor: string;
  minHeight: string;
  order: number;
  screenshotId?: string;
  boundingRect?: { top: number; left: number; width: number; height: number };
}

// ── V2 Component Detection ──────────────────────────
export type ComponentLabel = "button" | "card" | "nav" | "header" | "footer" 
  | "form" | "input" | "modal" | "dialog" | "badge" | "chip" | "avatar"
  | "hero" | "table" | "list" | "dropdown" | "tab" | "unknown";

export type SignalType = "semantic-html" | "aria-role" 
  | "repeated-structure" | "class-heuristic";

export interface DetectionSignal {
  type: SignalType;
  score: number;
  detail: string;
}

export interface BoundingBox {
  top: number; left: number; width: number; height: number;
}

export interface Component {
  id: string;
  label: ComponentLabel;
  confidence: number;        // 0–1
  instanceCount: number;
  signals: DetectionSignal[];
  html: string;              // outerHTML ≤4KB
  css: string;               // scoped non-default CSS
  selector: string;
  boundingBox: BoundingBox;
  hasChildren: boolean;
  childCount: number;
  isUncertain: boolean;      // true if 0.45–0.59
  ariaRole?: string;
  tagName: string;
}

// ── V2 Screenshot Record ─────────────────────────────
export interface ScreenshotRecord {
  id: string;
  fullPage: Blob;
  sections: SectionShot[];
  createdAt: number;
  totalSize: number;
}

export interface SectionShot {
  sectionId: string;
  label: string;
  blob: Blob;
  width: number;
  height: number;
}

export interface AssetManifest {
  images: ImageAsset[];
  svgs: SVGAsset[];
  favicon?: FaviconAsset;
  totalCount: number;
}

export interface ImageAsset {
  id: string;
  src: string;
  alt: string;
  naturalWidth: number;
  naturalHeight: number;
  type: "img" | "picture" | "css-background";
  mimeType: string;
  srcset?: string;
  sizeEstimate: number;
}

export interface SVGAsset {
  id: string;
  src?: string;
  inline: boolean;
  svgContent: string;
  width: number;
  height: number;
  isIcon: boolean;
}

export interface FaviconAsset {
  href: string;
  type: string;
  sizes?: string;
  dataUri: string;
}

export interface ExtractionResult {
  id: string; // UUID v4
  url: string;
  origin: string;
  title: string;
  favicon: string; // data URI or empty string
  timestamp: number;
  duration: number; // ms
  version: string;
  tokens: DesignTokens;
  assets: AssetManifest;
  layout?: LayoutStructure;
  components?: Component[];
  warnings: string[];
  confidence: number; // 0–1
  detectedFramework: FrameworkType;
}

export type ExportFormat =
  | "design-md"
  | "skill-md"
  | "tokens-json"
  | "tailwind-config"
  | "tailwind-v4-css"
  | "components-md"
  | "master-prompt"
  | "assets-zip"
  | "full-zip";

export type AITool = "cursor" | "claude-code" | "v0" | "bolt" | "lovable";

export interface Settings {
  schemaVersion: number;
  theme: "dark" | "light" | "system";
  defaultExportFormat: ExportFormat;
  defaultAITool: AITool;
  domSampleLimit: number;
  enableAnimationDetection: boolean;
  installedAt: number;
  lastOpenedAt: number;
}

export interface HistoryEntry {
  id: string;
  url: string;
  origin: string;
  title: string;
  faviconDataUri: string;
  timestamp: number;
  durationMs: number;
  colorCount: number;
  fontCount: number;
  componentCount: number;
  hasScreenshots: boolean;
  version: string;
}

export interface HistoryStore {
  entries: HistoryEntry[];
}

export interface ExtractionRecord {
  id: string;
  url: string;
  origin: string;
  timestamp: number;
  result: ExtractionResult;
}

export interface ExtractionCheckpoint {
  extractionId: string;
  tabId: number;
  url: string;
  title: string;
  phase: 1 | 2 | 3 | 4;
  step: string;
  pct: number;
  partialResult: Partial<ExtractionResult>;
  savedAt: number;
}

