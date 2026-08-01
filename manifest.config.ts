import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest(async (env) => ({
  manifest_version: 3,
  name: "StyleSnap",
  version: "1.0.0",
  minimum_chrome_version: "114",
  description: "Extract any website's design system in one click — tokens, components, assets, and AI prompts.",
  permissions: [
    "activeTab",
    "scripting",
    "storage",
    "sidePanel",
    "tabs",
    "downloads"
  ],
  host_permissions: ["<all_urls>"],
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  side_panel: {
    default_path: "src/sidepanel/index.html"
  },
  action: {
    default_title: "Open StyleSnap"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/isolated/index.ts"],
      run_at: "document_idle"
    }
  ]
}));
