import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest(async (env) => ({
  manifest_version: 3,
  name: "StyleSnap",
  version: "2.0.0",
  minimum_chrome_version: "114",
  description: "Extract any website's design system in one click — tokens, components, assets, and AI prompts.",
  permissions: [
    "activeTab",
    "scripting",
    "storage",
    "unlimitedStorage",
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
    default_path: "index.html"
  },
  action: {
    default_title: "Open StyleSnap",
    default_icon: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  icons: {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/isolated/index.ts"],
      run_at: "document_idle"
    }
  ]
}));
