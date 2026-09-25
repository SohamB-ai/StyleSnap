// Markdown Viewer Component — TypeUI DESIGN.md style code preview & quick install

import React from "react";
import { DesignMDPreview } from "./DesignMDPreview";

export const MarkdownViewer: React.FC = () => {
  return <DesignMDPreview defaultOpen={true} />;
};

export { DesignMDPreview };
