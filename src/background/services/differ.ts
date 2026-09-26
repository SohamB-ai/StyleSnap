// src/background/services/differ.ts
// Site-Diff Engine: compares two ExtractionResult objects across tokens, layout, components, and animations

import type {
  ExtractionResult,
  SiteDiffResult,
  TokenDiffGroup,
  TokenDiffEntry,
  LayoutDiff,
  ComponentDiff,
  AnimationDiff,
} from "../../shared/types";

export function diffExtractions(
  baseline: ExtractionResult,
  comparison: ExtractionResult
): SiteDiffResult {
  const tokenDiffs = diffTokens(baseline, comparison);
  const layoutDiffs = diffLayout(baseline, comparison);
  const componentDiffs = diffComponents(baseline, comparison);
  const animationDiffs = diffAnimations(baseline, comparison);

  // Overall similarity calculation: weighted average
  // Tokens: 45%, Components: 25%, Layout: 20%, Animations: 10%
  const tokenSim =
    tokenDiffs.length > 0
      ? tokenDiffs.reduce((acc, g) => acc + g.similarity, 0) / tokenDiffs.length
      : 100;

  const layoutSim =
    layoutDiffs.length === 0
      ? 100
      : Math.max(0, 100 - layoutDiffs.filter((d) => d.changeType !== "unchanged").length * 20);

  const compSim =
    componentDiffs.length === 0
      ? 100
      : Math.max(0, 100 - componentDiffs.filter((d) => d.changeType !== "unchanged").length * 15);

  const animSim =
    animationDiffs.length === 0
      ? 100
      : Math.max(0, 100 - animationDiffs.filter((d) => d.changeType !== "unchanged").length * 25);

  const overallSimilarity = Math.round(
    tokenSim * 0.45 + compSim * 0.25 + layoutSim * 0.2 + animSim * 0.1
  );

  return {
    baselineUrl: baseline.url,
    comparisonUrl: comparison.url,
    baselineTimestamp: baseline.timestamp,
    comparisonTimestamp: comparison.timestamp,
    tokenDiffs,
    layoutDiffs,
    componentDiffs,
    animationDiffs,
    overallSimilarity,
    summary: buildDiffSummary(tokenDiffs, layoutDiffs, componentDiffs, overallSimilarity),
  };
}

function diffTokens(a: ExtractionResult, b: ExtractionResult): TokenDiffGroup[] {
  const groups: TokenDiffGroup[] = [];

  // 1. Colors
  groups.push(diffColorTokens(a.tokens?.colors || [], b.tokens?.colors || []));

  // 2. Typography
  groups.push(diffTypography(a.tokens?.typography, b.tokens?.typography));

  // 3. Spacing
  groups.push(diffSpacing(a.tokens?.spacing, b.tokens?.spacing));

  // 4. Shadows
  groups.push(
    diffSimpleScale(
      "shadows",
      (a.tokens?.shadows || []).map((s) => ({ name: s.level, value: s.value })),
      (b.tokens?.shadows || []).map((s) => ({ name: s.level, value: s.value }))
    )
  );

  // 5. Radii
  groups.push(
    diffSimpleScale(
      "radii",
      (a.tokens?.radii || []).map((r) => ({ name: r.level, value: r.value })),
      (b.tokens?.radii || []).map((r) => ({ name: r.level, value: r.value }))
    )
  );

  // 6. Breakpoints
  groups.push(
    diffSimpleScale(
      "breakpoints",
      (a.tokens?.breakpoints || []).map((bp) => ({ name: bp.label, value: `${bp.px}px` })),
      (b.tokens?.breakpoints || []).map((bp) => ({ name: bp.label, value: `${bp.px}px` }))
    )
  );

  // 7. Z-Index
  groups.push(
    diffSimpleScale(
      "zIndex",
      (a.tokens?.zIndex || []).map((z) => ({ name: `z-${z.value}`, value: String(z.value) })),
      (b.tokens?.zIndex || []).map((z) => ({ name: `z-${z.value}`, value: String(z.value) }))
    )
  );

  return groups;
}

function diffColorTokens(aColors: any[], bColors: any[]): TokenDiffGroup {
  const aMap = new Map(aColors.map((c) => [c.hex.toLowerCase(), c]));
  const bMap = new Map(bColors.map((c) => [c.hex.toLowerCase(), c]));
  const changes: TokenDiffEntry[] = [];

  aMap.forEach((_, hex) => {
    if (!bMap.has(hex)) {
      changes.push({
        name: hex,
        changeType: "removed",
        baselineValue: hex,
      });
    }
  });

  bMap.forEach((_, hex) => {
    if (!aMap.has(hex)) {
      changes.push({
        name: hex,
        changeType: "added",
        comparisonValue: hex,
      });
    }
  });

  const allKeys = new Set([...aMap.keys(), ...bMap.keys()]);
  const unchanged = allKeys.size - changes.length;
  const similarity = allKeys.size > 0 ? Math.round((unchanged / allKeys.size) * 100) : 100;

  return {
    category: "colors",
    changes,
    similarity,
  };
}

function diffTypography(aTypo: any, bTypo: any): TokenDiffGroup {
  const changes: TokenDiffEntry[] = [];

  const aFamilies = new Set<string>((aTypo?.families || []).map((f: any) => f.family));
  const bFamilies = new Set<string>((bTypo?.families || []).map((f: any) => f.family));

  aFamilies.forEach((f) => {
    if (!bFamilies.has(f)) {
      changes.push({
        name: `Font: ${f}`,
        changeType: "removed",
        baselineValue: f,
      });
    }
  });

  bFamilies.forEach((f) => {
    if (!aFamilies.has(f)) {
      changes.push({
        name: `Font: ${f}`,
        changeType: "added",
        comparisonValue: f,
      });
    }
  });

  const all = new Set([...aFamilies, ...bFamilies]);
  const unchanged = all.size - changes.length;
  const similarity = all.size > 0 ? Math.round((unchanged / all.size) * 100) : 100;

  return {
    category: "typography",
    changes,
    similarity,
  };
}

function diffSpacing(aSpacing: any, bSpacing: any): TokenDiffGroup {
  const changes: TokenDiffEntry[] = [];
  const aVals = new Set<string>((aSpacing?.values || []).map((s: any) => s.value));
  const bVals = new Set<string>((bSpacing?.values || []).map((s: any) => s.value));

  aVals.forEach((v) => {
    if (!bVals.has(v)) {
      changes.push({
        name: `Spacing: ${v}`,
        changeType: "removed",
        baselineValue: v,
      });
    }
  });

  bVals.forEach((v) => {
    if (!aVals.has(v)) {
      changes.push({
        name: `Spacing: ${v}`,
        changeType: "added",
        comparisonValue: v,
      });
    }
  });

  const all = new Set([...aVals, ...bVals]);
  const unchanged = all.size - changes.length;
  const similarity = all.size > 0 ? Math.round((unchanged / all.size) * 100) : 100;

  return {
    category: "spacing",
    changes,
    similarity,
  };
}

function diffSimpleScale(
  category: TokenDiffGroup["category"],
  aItems: { name: string; value: string }[],
  bItems: { name: string; value: string }[]
): TokenDiffGroup {
  const aMap = new Map(aItems.map((i) => [i.name, i.value]));
  const bMap = new Map(bItems.map((i) => [i.name, i.value]));
  const changes: TokenDiffEntry[] = [];

  aMap.forEach((val, name) => {
    if (!bMap.has(name)) {
      changes.push({
        name,
        changeType: "removed",
        baselineValue: val,
      });
    } else if (bMap.get(name) !== val) {
      changes.push({
        name,
        changeType: "modified",
        baselineValue: val,
        comparisonValue: bMap.get(name),
      });
    }
  });

  bMap.forEach((val, name) => {
    if (!aMap.has(name)) {
      changes.push({
        name,
        changeType: "added",
        comparisonValue: val,
      });
    }
  });

  const all = new Set([...aMap.keys(), ...bMap.keys()]);
  const unchanged = all.size - changes.length;
  const similarity = all.size > 0 ? Math.round((unchanged / all.size) * 100) : 100;

  return {
    category,
    changes,
    similarity,
  };
}

function diffLayout(a: ExtractionResult, b: ExtractionResult): LayoutDiff[] {
  const diffs: LayoutDiff[] = [];
  const aSections = (a.layout?.sections || []).map((s) => s.label);
  const bSections = (b.layout?.sections || []).map((s) => s.label);

  const aSet = new Set(aSections);
  const bSet = new Set(bSections);

  aSet.forEach((sec) => {
    if (!bSet.has(sec)) {
      diffs.push({
        section: sec,
        changeType: "removed",
        details: `Section "${sec}" was in baseline but not present in comparison`,
      });
    }
  });

  bSet.forEach((sec) => {
    if (!aSet.has(sec)) {
      diffs.push({
        section: sec,
        changeType: "added",
        details: `Section "${sec}" newly added in comparison`,
      });
    }
  });

  return diffs;
}

function diffComponents(a: ExtractionResult, b: ExtractionResult): ComponentDiff[] {
  const diffs: ComponentDiff[] = [];
  const aComps = new Map((a.components || []).map((c) => [c.label, c]));
  const bComps = new Map((b.components || []).map((c) => [c.label, c]));

  aComps.forEach((comp, label) => {
    if (!bComps.has(label)) {
      diffs.push({
        label,
        changeType: "removed",
        baselineCount: comp.instanceCount,
      });
    } else {
      const bComp = bComps.get(label)!;
      if (comp.instanceCount !== bComp.instanceCount) {
        diffs.push({
          label,
          changeType: "modified",
          baselineCount: comp.instanceCount,
          comparisonCount: bComp.instanceCount,
          structuralChanges: `Instances: ${comp.instanceCount} → ${bComp.instanceCount}`,
        });
      }
    }
  });

  bComps.forEach((comp, label) => {
    if (!aComps.has(label)) {
      diffs.push({
        label,
        changeType: "added",
        comparisonCount: comp.instanceCount,
      });
    }
  });

  return diffs;
}

function diffAnimations(a: ExtractionResult, b: ExtractionResult): AnimationDiff[] {
  const diffs: AnimationDiff[] = [];
  const aLibs = new Map((a.animations?.libraries || []).map((l) => [l.library, l]));
  const bLibs = new Map((b.animations?.libraries || []).map((l) => [l.library, l]));

  aLibs.forEach((lib, name) => {
    if (!bLibs.has(name)) {
      diffs.push({
        library: name,
        changeType: "removed",
        details: `Library ${name} removed`,
      });
    }
  });

  bLibs.forEach((lib, name) => {
    if (!aLibs.has(name)) {
      diffs.push({
        library: name,
        changeType: "added",
        details: lib.description,
      });
    }
  });

  return diffs;
}

function buildDiffSummary(
  tokenDiffs: TokenDiffGroup[],
  layoutDiffs: LayoutDiff[],
  componentDiffs: ComponentDiff[],
  similarity: number
): string {
  const totalTokenChanges = tokenDiffs.reduce((sum, g) => sum + g.changes.length, 0);
  const totalLayoutChanges = layoutDiffs.length;
  const totalCompChanges = componentDiffs.length;
  const total = totalTokenChanges + totalLayoutChanges + totalCompChanges;

  if (total === 0) {
    return "100% Match · No differences detected between the two design systems.";
  }

  return `${similarity}% Similarity · ${total} differences identified (${totalTokenChanges} tokens, ${totalCompChanges} components, ${totalLayoutChanges} layout sections).`;
}
