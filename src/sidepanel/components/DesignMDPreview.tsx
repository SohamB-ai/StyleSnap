// DESIGN.md & AI Markdown Preview Component — Studio Black theme interactive preview

import React, { useState, useMemo } from "react";
import {
  FileText,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Code2,
  Eye
} from "lucide-react";
import { useStore } from "../store";
import { generateDesignMD, generateSkillMD, generateMotionMD } from "../../background/services/exporter";
import { MessageType } from "../../shared/messages";

interface DesignMDPreviewProps {
  initialFormat?: "design-md" | "skill-md" | "motion-md";
  defaultOpen?: boolean;
}

type Block =
  | { type: "h1"; content: string }
  | { type: "h2"; content: string }
  | { type: "h3"; content: string }
  | { type: "blockquote"; lines: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; content: string }
  | { type: "divider" };

// Parse markdown into structured block elements
function parseMarkdownBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Horizontal divider or YAML frontmatter boundary
    if (trimmed === "---") {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    // Empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Code blocks: ```
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // Markdown Table: lines starting and ending with |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const splitRow = (row: string) =>
          row
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());

        const headers = splitRow(tableLines[0]);
        // line 1 is separator |---|---|
        const rows = tableLines.slice(2).map(splitRow);
        blocks.push({ type: "table", headers, rows });
        continue;
      }
    }

    // Blockquotes: >
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    // Unordered lists: - or *
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    // Headings
    if (rawLine.startsWith("# ")) {
      blocks.push({ type: "h1", content: rawLine.slice(2).trim() });
      i++;
      continue;
    }
    if (rawLine.startsWith("## ")) {
      blocks.push({ type: "h2", content: rawLine.slice(3).trim() });
      i++;
      continue;
    }
    if (rawLine.startsWith("### ")) {
      blocks.push({ type: "h3", content: rawLine.slice(4).trim() });
      i++;
      continue;
    }

    // Paragraph
    blocks.push({ type: "paragraph", content: rawLine });
    i++;
  }

  return blocks;
}

// Regex to detect hex color code
const HEX_COLOR_REGEX = /#([0-9a-fA-F]{3,8})\b/;

// Render inline markdown elements (bold, code, links, color swatches)
function renderInlineContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      parts.push(renderPlainTextWithColors(plain, `${lastIndex}`));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      const codeVal = token.slice(1, -1);
      const isHex = HEX_COLOR_REGEX.test(codeVal) && (codeVal.length === 4 || codeVal.length === 7 || codeVal.length === 9);
      parts.push(
        <span
          key={key}
          className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-white font-mono text-[10px]"
        >
          {isHex && (
            <span
              className="w-2.5 h-2.5 rounded-full border border-zinc-700 shrink-0 shadow-xs"
              style={{ backgroundColor: codeVal }}
            />
          )}
          <span>{codeVal}</span>
        </span>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={key} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const closeBracket = token.indexOf("](");
      const label = token.slice(1, closeBracket);
      const url = token.slice(closeBracket + 2, -1);
      parts.push(
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-white underline underline-offset-2 hover:text-zinc-300 transition-colors"
        >
          {label}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(renderPlainTextWithColors(text.slice(lastIndex), `${lastIndex}`));
  }

  return parts;
}

function renderPlainTextWithColors(text: string, baseKey: string): React.ReactNode {
  const match = HEX_COLOR_REGEX.exec(text);
  if (match && (match[0].length === 4 || match[0].length === 7 || match[0].length === 9)) {
    const start = match.index;
    const end = start + match[0].length;
    return (
      <span key={baseKey}>
        {text.slice(0, start)}
        <span className="inline-flex items-center gap-1 font-mono text-white">
          <span
            className="w-2.5 h-2.5 rounded-full border border-zinc-700 inline-block shrink-0 align-middle shadow-xs"
            style={{ backgroundColor: match[0] }}
          />
          {match[0]}
        </span>
        {text.slice(end)}
      </span>
    );
  }
  return text;
}

export const DesignMDPreview: React.FC<DesignMDPreviewProps> = ({
  initialFormat = "design-md",
  defaultOpen = true
}) => {
  const result = useStore((s) => s.result);
  const showToast = useStore((s) => s.showToast);

  const [activeDoc, setActiveDoc] = useState<"design-md" | "skill-md" | "motion-md">(initialFormat);
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [isExpandedHeight, setIsExpandedHeight] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<string | null>(null);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>("all");

  const markdownText = useMemo(() => {
    if (!result) return "";
    if (activeDoc === "design-md") return generateDesignMD(result);
    if (activeDoc === "skill-md") return generateSkillMD(result);
    return generateMotionMD(result);
  }, [result, activeDoc]);

  const blocks = useMemo(() => {
    return parseMarkdownBlocks(markdownText);
  }, [markdownText]);

  // Extract available sections for quick filter navigation
  const availableSections = useMemo(() => {
    const list: string[] = ["all"];
    for (const b of blocks) {
      if (b.type === "h2") {
        const clean = b.content.replace(/^[0-9.]+\s*/, "").replace(/\(.*?\)/, "").trim();
        if (clean && !list.includes(clean)) {
          list.push(clean);
        }
      }
    }
    return list;
  }, [blocks]);

  if (!result) return null;

  const estimatedTokens = Math.round(markdownText.length / 4);
  const linesCount = markdownText.split("\n").length;

  const handleCopy = () => {
    if (!markdownText) return;
    navigator.clipboard.writeText(markdownText).then(() => {
      setCopiedAll(true);
      const label = activeDoc === "design-md" ? "DESIGN.md" : activeDoc === "skill-md" ? "SKILL.md" : "MOTION.md";
      showToast(`Copied ${label} to clipboard!`, "success");
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  const handleCopySnippet = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedCodeBlock(id);
      showToast("Copied code snippet!", "success");
      setTimeout(() => setCopiedCodeBlock(null), 2000);
    });
  };

  const handleDownload = () => {
    // 1. Send download message through background exporter
    chrome.runtime?.sendMessage?.({
      type: MessageType.EXPORT_FILE,
      payload: { format: activeDoc, extractionId: result.id }
    }).catch(() => {});

    // 2. Direct browser fallback download
    const filename = activeDoc === "design-md" ? "DESIGN.md" : activeDoc === "skill-md" ? "SKILL.md" : "MOTION.md";
    const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, "success");
  };

  // Filter blocks if a specific section is chosen
  const filteredBlocks = useMemo(() => {
    if (activeSectionFilter === "all") return blocks;
    const resultBlocks: Block[] = [];
    let collecting = false;

    for (const b of blocks) {
      if (b.type === "h1" || b.type === "blockquote") {
        resultBlocks.push(b);
        continue;
      }
      if (b.type === "h2") {
        const clean = b.content.replace(/^[0-9.]+\s*/, "").replace(/\(.*?\)/, "").trim();
        collecting = clean.toLowerCase() === activeSectionFilter.toLowerCase();
      }
      if (collecting) {
        resultBlocks.push(b);
      }
    }
    return resultBlocks;
  }, [blocks, activeSectionFilter]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-black overflow-hidden shadow-lg transition-all text-zinc-100">
      {/* Top Header Card — Sleek Deep Black */}
      <div className="p-3 bg-black border-b border-zinc-800 flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-700/80 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-white truncate tracking-tight">
                {activeDoc === "design-md" ? "DESIGN.md" : activeDoc === "skill-md" ? "SKILL.md" : "MOTION.md"} Preview
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700/60 text-emerald-400 font-semibold">
                Live
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center gap-2 font-mono">
              <span>~{estimatedTokens} tokens</span>
              <span>•</span>
              <span>{linesCount} lines</span>
              <span>•</span>
              <span>{(markdownText.length / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Document Switcher Pill */}
          <div className="bg-zinc-900 p-0.5 rounded-md border border-zinc-800 flex items-center text-[10px]">
            <button
              onClick={() => setActiveDoc("design-md")}
              className={`px-2 py-0.5 rounded font-mono font-medium transition-all ${
                activeDoc === "design-md"
                  ? "bg-white text-black shadow-xs font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Preview DESIGN.md"
            >
              DESIGN.md
            </button>
            <button
              onClick={() => setActiveDoc("skill-md")}
              className={`px-2 py-0.5 rounded font-mono font-medium transition-all ${
                activeDoc === "skill-md"
                  ? "bg-white text-black shadow-xs font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Preview SKILL.md"
            >
              SKILL.md
            </button>
            {result.animations && (
              <button
                onClick={() => setActiveDoc("motion-md")}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-all ${
                  activeDoc === "motion-md"
                    ? "bg-white text-black shadow-xs font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Preview MOTION.md"
              >
                MOTION.md
              </button>
            )}
          </div>

          {/* Collapse / Expand Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title={isOpen ? "Collapse Preview" : "Expand Preview"}
            aria-label="Toggle Preview"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Preview Body */}
      {isOpen && (
        <div className="flex flex-col bg-black">
          {/* Sub-toolbar: View mode switcher + action buttons */}
          <div className="px-3 py-1.5 bg-black border-b border-zinc-800 flex items-center justify-between gap-2 select-none flex-wrap">
            {/* View Mode Toggle: Formatted vs Raw */}
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800 text-[10px]">
              <button
                onClick={() => setViewMode("formatted")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                  viewMode === "formatted"
                    ? "bg-zinc-800 text-white font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Eye className="w-3 h-3 text-white" />
                <span>Rendered</span>
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                  viewMode === "raw"
                    ? "bg-zinc-800 text-white font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Code2 className="w-3 h-3 text-white" />
                <span>Raw Markdown</span>
              </button>
            </div>

            {/* Actions: Copy, Download, Height */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-[10px] font-medium text-zinc-200 flex items-center gap-1 transition-all active:scale-[0.98]"
                title="Copy Full Markdown"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="px-2 py-1 bg-white hover:bg-zinc-200 text-black font-semibold rounded text-[10px] flex items-center gap-1 transition-all active:scale-[0.98] shadow-xs"
                title="Download Markdown File"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>

              <button
                onClick={() => setIsExpandedHeight(!isExpandedHeight)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded border border-zinc-800 transition-colors"
                title={isExpandedHeight ? "Compact Height" : "Expand Height"}
              >
                {isExpandedHeight ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Quick Section Filter Chips (Formatted View Only) */}
          {viewMode === "formatted" && availableSections.length > 2 && (
            <div className="px-3 py-1.5 bg-black border-b border-zinc-800 flex items-center gap-1 overflow-x-auto scrollbar-none select-none">
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-zinc-500 mr-1 shrink-0">
                Sections:
              </span>
              {availableSections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setActiveSectionFilter(sec)}
                  className={`text-[9.5px] px-2 py-0.5 rounded-full border transition-all shrink-0 font-medium ${
                    activeSectionFilter.toLowerCase() === sec.toLowerCase()
                      ? "border-white bg-white text-black font-semibold shadow-xs"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  {sec === "all" ? "All Content" : sec}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable Document Content Viewport — Pure Deep Black */}
          <div
            className={`overflow-y-auto overscroll-contain transition-all select-text bg-black ${
              isExpandedHeight ? "max-h-[520px]" : "max-h-[300px]"
            }`}
          >
            {viewMode === "formatted" ? (
              /* FORMATTED MARKDOWN VIEW */
              <div className="p-3.5 space-y-3.5 text-xs leading-relaxed bg-black text-zinc-200">
                {filteredBlocks.map((block, idx) => {
                  switch (block.type) {
                    case "h1":
                      return (
                        <div
                          key={idx}
                          className="pb-2 border-b border-zinc-800 flex items-center gap-2"
                        >
                          <div className="w-1.5 h-4 bg-white rounded-full shadow-xs" />
                          <h1 className="font-bold text-sm text-white tracking-tight">
                            {renderInlineContent(block.content)}
                          </h1>
                        </div>
                      );

                    case "h2":
                      return (
                        <div
                          key={idx}
                          className="pt-2 pb-1 border-b border-zinc-800 flex items-center justify-between"
                        >
                          <h2 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                            <span className="w-1 h-3 bg-zinc-400 rounded-xs" />
                            <span>{renderInlineContent(block.content)}</span>
                          </h2>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">Section</span>
                        </div>
                      );

                    case "h3":
                      return (
                        <h3
                          key={idx}
                          className="font-semibold text-[11px] text-zinc-200 pt-1 flex items-center gap-1"
                        >
                          <span className="text-zinc-400">•</span>
                          <span>{renderInlineContent(block.content)}</span>
                        </h3>
                      );

                    case "blockquote":
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-zinc-900/90 border-l-2 border-white text-zinc-300 text-[11px] space-y-0.5 shadow-xs"
                        >
                          {block.lines.map((ql, qIdx) => (
                            <div key={qIdx} className="leading-snug">
                              {renderInlineContent(ql)}
                            </div>
                          ))}
                        </div>
                      );

                    case "code":
                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-zinc-800 bg-black overflow-hidden shadow-inner flex flex-col"
                        >
                          <div className="bg-zinc-900 px-2.5 py-1 border-b border-zinc-800 flex items-center justify-between select-none">
                            <span className="font-mono text-[9.5px] uppercase font-bold text-zinc-400">
                              {block.lang || "code"}
                            </span>
                            <button
                              onClick={() => handleCopySnippet(block.code, `code-${idx}`)}
                              className="px-1.5 py-0.5 rounded text-[9.5px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex items-center gap-1"
                            >
                              {copiedCodeBlock === `code-${idx}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 font-mono text-[10.5px] leading-relaxed text-zinc-200 overflow-x-auto whitespace-pre bg-black">
                            {block.code}
                          </pre>
                        </div>
                      );

                    case "table":
                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-zinc-800 bg-black overflow-x-auto shadow-xs"
                        >
                          <table className="w-full text-left border-collapse text-[10.5px]">
                            <thead>
                              <tr className="bg-zinc-900 border-b border-zinc-800 select-none">
                                {block.headers.map((h, hIdx) => (
                                  <th
                                    key={hIdx}
                                    className="py-1.5 px-2.5 font-bold uppercase tracking-wider text-[9px] text-zinc-400"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {block.rows.map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  className="border-b border-zinc-800/60 last:border-b-0 hover:bg-zinc-900/50 transition-colors"
                                >
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="py-1.5 px-2.5 font-mono text-zinc-200">
                                      {renderInlineContent(cell)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );

                    case "list":
                      return (
                        <ul key={idx} className="space-y-1 pl-1">
                          {block.items.map((item, itIdx) => (
                            <li
                              key={itIdx}
                              className="flex items-start gap-2 text-zinc-300 text-[11px] leading-snug"
                            >
                              <span className="text-white font-bold mt-0.5 select-none">•</span>
                              <span className="flex-1">{renderInlineContent(item)}</span>
                            </li>
                          ))}
                        </ul>
                      );

                    case "paragraph":
                      return (
                        <p key={idx} className="text-zinc-300 text-[11px] leading-relaxed">
                          {renderInlineContent(block.content)}
                        </p>
                      );

                    case "divider":
                      return <hr key={idx} className="border-zinc-800 my-2" />;

                    default:
                      return null;
                  }
                })}
              </div>
            ) : (
              /* RAW MARKDOWN VIEW (IDE Line-Numbered Code Block on True Black) */
              <div className="bg-black p-3 flex font-mono text-[10.5px] leading-relaxed text-zinc-200">
                <div className="select-none pr-3 text-zinc-600 text-right shrink-0 border-r border-zinc-800">
                  {markdownText.split("\n").map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <pre className="pl-3 overflow-x-auto whitespace-pre select-text flex-1 text-zinc-200 bg-black">
                  {markdownText}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
