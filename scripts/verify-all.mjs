// Comprehensive Test Suite for StyleSnap V2 Engine
// Verifies Exporters, Prompt Generators, Token Handlers, and Bundle Validity

import assert from "node:assert";

// Synthetic Fixture representing an extracted production website
const mockResult = {
  id: "test-extraction-001",
  url: "https://example.com/app",
  origin: "https://example.com",
  title: "Example Studio Design System",
  favicon: "https://example.com/favicon.ico",
  timestamp: Date.now(),
  duration: 1240,
  confidence: 0.94,
  version: "2.0.0",
  detectedFramework: "tailwind-v4",
  warnings: [],
  tokens: {
    themeSummary: "Dark mode design system featuring Electric Blue palette, clean visual hierarchy with tailwind-v4.",
    colors: [
      {
        id: "col-1",
        value: "#0F0F11",
        hex: "#0F0F11",
        hsl: "hsl(240 7% 6%)",
        rgb: "rgb(15, 15, 17)",
        opacity: 1,
        frequency: 45,
        contexts: ["background"],
        semanticGroup: "neutral",
        suggestedName: "Background Base",
        cssVarName: "--bg-base"
      },
      {
        id: "col-2",
        value: "#4F46E5",
        hex: "#4F46E5",
        hsl: "hsl(244 76% 59%)",
        rgb: "rgb(79, 70, 229)",
        opacity: 1,
        frequency: 28,
        contexts: ["background", "border", "fill"],
        semanticGroup: "primary",
        suggestedName: "Indigo Primary",
        cssVarName: "--color-primary"
      },
      {
        id: "col-3",
        value: "#FAFAFA",
        hex: "#FAFAFA",
        hsl: "hsl(0 0% 98%)",
        rgb: "rgb(250, 250, 250)",
        opacity: 1,
        frequency: 60,
        contexts: ["text"],
        semanticGroup: "neutral",
        suggestedName: "Text Primary",
        cssVarName: "--text-primary"
      },
      {
        id: "col-4",
        value: "#38BDF8",
        hex: "#38BDF8",
        hsl: "hsl(199 95% 60%)",
        rgb: "rgb(56, 189, 248)",
        opacity: 1,
        frequency: 14,
        contexts: ["text", "border"],
        semanticGroup: "accent",
        suggestedName: "Sky Accent",
        cssVarName: "--color-accent"
      }
    ],
    typography: {
      families: [
        {
          name: "Inter",
          stack: "Inter, system-ui, sans-serif",
          category: "sans-serif",
          weights: [400, 500, 600, 700],
          frequency: 85
        }
      ],
      scale: [
        {
          role: "h1",
          fontSize: "40px",
          fontSizePx: 40,
          fontWeight: "700",
          lineHeight: "1.2",
          letterSpacing: "-0.02em",
          fontFamily: "Inter",
          frequency: 2
        },
        {
          role: "h2",
          fontSize: "32px",
          fontSizePx: 32,
          fontWeight: "600",
          lineHeight: "1.25",
          letterSpacing: "-0.01em",
          fontFamily: "Inter",
          frequency: 5
        },
        {
          role: "body",
          fontSize: "14px",
          fontSizePx: 14,
          fontWeight: "400",
          lineHeight: "1.5",
          letterSpacing: "normal",
          fontFamily: "Inter",
          frequency: 45
        },
        {
          role: "caption",
          fontSize: "11px",
          fontSizePx: 11,
          fontWeight: "400",
          lineHeight: "1.4",
          letterSpacing: "0.01em",
          fontFamily: "Inter",
          frequency: 12
        }
      ],
      lineHeights: ["1", "1.2", "1.5"],
      letterSpacings: ["normal", "-0.02em"]
    },
    spacing: {
      baseUnit: 4,
      isGrid: true,
      values: [
        { px: 4, rem: "0.25rem", token: "space-4", frequency: 10 },
        { px: 8, rem: "0.5rem", token: "space-8", frequency: 22 },
        { px: 12, rem: "0.75rem", token: "space-12", frequency: 18 },
        { px: 16, rem: "1rem", token: "space-16", frequency: 35 },
        { px: 24, rem: "1.5rem", token: "space-24", frequency: 15 },
        { px: 32, rem: "2rem", token: "space-32", frequency: 8 }
      ],
      anomalies: []
    },
    shadows: [
      { level: "sm", value: "0 1px 2px 0 rgba(0,0,0,0.05)", blurPx: 2, spreadPx: 0, colorRgba: "rgba(0,0,0,0.05)", frequency: 10 },
      { level: "md", value: "0 4px 6px -1px rgba(0,0,0,0.1)", blurPx: 6, spreadPx: -1, colorRgba: "rgba(0,0,0,0.1)", frequency: 15 },
      { level: "lg", value: "0 10px 15px -3px rgba(0,0,0,0.15)", blurPx: 15, spreadPx: -3, colorRgba: "rgba(0,0,0,0.15)", frequency: 4 }
    ],
    radii: [
      { level: "sm", value: "4px", valuePx: 4, frequency: 12 },
      { level: "md", value: "8px", valuePx: 8, frequency: 25 },
      { level: "lg", value: "12px", valuePx: 12, frequency: 6 },
      { level: "full", value: "9999px", valuePx: 9999, frequency: 3 }
    ],
    breakpoints: [
      { px: 640, em: "40em", label: "sm" },
      { px: 768, em: "48em", label: "md" },
      { px: 1024, em: "64em", label: "lg" },
      { px: 1280, em: "80em", label: "xl" }
    ],
    zIndex: [
      { value: 10, frequency: 4, contexts: ["header", "nav"] },
      { value: 50, frequency: 2, contexts: ["dialog", "modal"] }
    ],
    cssVariables: {
      "--bg-base": "#0F0F11",
      "--color-primary": "#4F46E5",
      "--text-primary": "#FAFAFA"
    }
  },
  layout: {
    maxContentWidth: "1280px",
    baseGrid: { type: "css-grid", columnCount: 12 },
    sections: [
      { id: "sec-1", tagName: "header", label: "navigation", layoutType: "flex", gap: "16px", padding: "16px 24px" },
      { id: "sec-2", tagName: "main", label: "hero", layoutType: "grid", gridCols: "repeat(12, 1fr)", gap: "24px", padding: "48px 24px" },
      { id: "sec-3", tagName: "section", label: "features", layoutType: "grid", gridCols: "repeat(3, 1fr)", gap: "20px", padding: "40px 24px" },
      { id: "sec-4", tagName: "footer", label: "footer", layoutType: "flex", gap: "12px", padding: "32px 24px" }
    ]
  },
  components: [
    {
      id: "comp-btn-1",
      label: "button",
      confidence: 0.92,
      instanceCount: 6,
      signals: [{ type: "semantic-html", score: 0.35, detail: "tagName=button" }],
      html: '<button class="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium">Get Started</button>',
      css: "display: inline-flex;\nalign-items: center;\npadding: 8px 16px;\nbackground-color: #4F46E5;\ncolor: #FFFFFF;\nborder-radius: 8px;",
      selector: ".btn-primary",
      boundingBox: { top: 120, left: 24, width: 120, height: 40 },
      hasChildren: false,
      childCount: 0,
      isUncertain: false,
      tagName: "button"
    },
    {
      id: "comp-card-1",
      label: "card",
      confidence: 0.85,
      instanceCount: 3,
      signals: [{ type: "repeated-structure", score: 0.25, detail: "signature matches" }],
      html: '<div class="p-6 rounded-xl border border-zinc-800 bg-zinc-900"><h3>Title</h3><p>Content</p></div>',
      css: "padding: 24px;\nbackground-color: #1A1A1F;\nborder: 1px solid #2E2E36;\nborder-radius: 12px;",
      selector: ".feature-card",
      boundingBox: { top: 300, left: 24, width: 340, height: 200 },
      hasChildren: true,
      childCount: 2,
      isUncertain: false,
      tagName: "div"
    }
  ],
  assets: {
    images: [],
    svgs: [],
    favicon: undefined,
    totalCount: 0
  }
};

async function runTests() {
  console.log("=== Running StyleSnap V2 Test Suite ===");

  // 1. Test bundled exports from dist
  const bundle = await import("../dist/assets/promptEngine-BjchrBIG.js");
  console.log("[Test 1] Bundled module loaded successfully.");

  // Check exported functions exist
  assert.ok(bundle.b, "generateDesignMD export exists");
  assert.ok(bundle.c, "generateMasterPrompt export exists");
  assert.ok(bundle.k, "generateTokensJSON export exists");

  // 2. Test generateTokensJSON
  const tokensJsonStr = bundle.k(mockResult);
  assert.ok(tokensJsonStr, "tokens.json is generated");
  const parsedDtcg = JSON.parse(tokensJsonStr);
  assert.strictEqual(parsedDtcg.$metadata.dtcgVersion, "2025.10");
  assert.ok(parsedDtcg.color, "tokens.json has color group");
  assert.ok(parsedDtcg["z-index"], "tokens.json has z-index group");
  console.log("✓ Test 2 PASSED: tokens.json conforms to DTCG standard with z-index.");

  // 3. Test generateDesignMD
  const designMD = bundle.b(mockResult);
  assert.ok(designMD.includes("# DESIGN SYSTEM — Example Studio Design System"), "DESIGN.md has title");
  assert.ok(designMD.includes("Page Layout & Section Structure"), "DESIGN.md has Layout section");
  assert.ok(designMD.includes("Component Library"), "DESIGN.md has Component Library");
  assert.ok(designMD.includes("Z-Index Elevation"), "DESIGN.md has Z-Index section");
  assert.ok(designMD.includes("Colour Palette"), "DESIGN.md has Colour Palette");
  assert.ok(designMD.includes("Interactive States & Animation Guidelines"), "DESIGN.md has Animation Guidelines");
  console.log("✓ Test 3 PASSED: DESIGN.md contains all comprehensive sections.");

  // 4. Test generateMasterPrompt across all 5 AI tools
  const tools = ["cursor", "claude-code", "v0", "bolt", "lovable"];
  for (const tool of tools) {
    const prompt = bundle.c(mockResult, tool);
    assert.ok(prompt && prompt.length > 500, `Prompt for ${tool} is non-empty and substantial`);

    if (tool === "v0") {
      assert.ok(prompt.includes("shadcn/ui"), "v0 prompt mentions shadcn/ui");
      assert.ok(prompt.includes("Typography Hierarchy"), "v0 prompt includes Typography Hierarchy");
      assert.ok(prompt.includes("Component Specs"), "v0 prompt includes Component Specs");
      assert.ok(prompt.length >= 1000, "v0 prompt is expanded (budget ~4000 tokens)");
    }

    if (tool === "lovable") {
      assert.ok(prompt.includes("Vision & Context"), "Lovable prompt uses MLP format");
      assert.ok(prompt.includes("Strict Visual Style Rules"), "Lovable prompt includes Style Rules");
      assert.ok(prompt.includes("Component Blueprints"), "Lovable prompt includes Component Blueprints");
      assert.ok(prompt.length >= 1000, "Lovable prompt is expanded (budget ~3000 tokens)");
    }

    if (tool === "claude-code") {
      assert.ok(prompt.startsWith("---"), "Claude Code prompt starts with YAML frontmatter");
      assert.ok(prompt.includes("CSS Custom Properties"), "Claude Code prompt includes CSS Custom Properties");
      assert.ok(prompt.includes("Extracted Components"), "Claude Code prompt includes Components");
    }

    if (tool === "cursor") {
      assert.ok(prompt.includes(".cursorrules"), "Cursor prompt includes .cursorrules");
      assert.ok(prompt.includes("TAILWIND CONFIGURATION"), "Cursor prompt includes Tailwind Config");
    }

    if (tool === "bolt") {
      assert.ok(prompt.includes("STEP 1: Vibe & Purpose"), "Bolt prompt uses 5-step framework");
      assert.ok(prompt.includes("STEP 4: Site Architecture"), "Bolt prompt includes Site Architecture");
    }

    console.log(`✓ Test: ${tool} prompt generated successfully (${Math.round(prompt.length / 4)} tokens)`);
  }

  // 5. Test manifest.json consistency in dist
  const fs = await import("node:fs");
  const manifestRaw = fs.readFileSync("./dist/manifest.json", "utf8");
  const manifest = JSON.parse(manifestRaw);
  assert.strictEqual(manifest.version, "2.0.0", "Manifest version is 2.0.0");
  assert.strictEqual(manifest.name, "StyleSnap", "Manifest name is StyleSnap");
  assert.ok(manifest.action.default_icon["128"], "Manifest has 128 icon");
  assert.ok(fs.existsSync("./dist/icons/icon-128.png"), "dist/icons/icon-128.png exists");
  console.log("✓ Test 5 PASSED: dist/manifest.json and icons are verified.");

  console.log("\nALL TESTS PASSED! 100% verification successful.\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
