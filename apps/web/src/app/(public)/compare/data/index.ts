// Re-export types
export type {
  ComparisonRow,
  DetailedSection,
  ComparisonPageData,
} from "./types";

// Re-export individual comparisons
export { guardianvets } from "./guardianvets";
export { vettriage } from "./vettriage";
export { smithAi } from "./smith-ai";
export { rubyReceptionists } from "./ruby-receptionists";
export { dialzara } from "./dialzara";

// Aggregated data and slugs
import { guardianvets } from "./guardianvets";
import { vettriage } from "./vettriage";
import { smithAi } from "./smith-ai";
import { rubyReceptionists } from "./ruby-receptionists";
import { dialzara } from "./dialzara";
import type { ComparisonPageData } from "./types";

export const comparisons: Record<string, ComparisonPageData> = {
  guardianvets,
  vettriage,
  "smith-ai": smithAi,
  "ruby-receptionists": rubyReceptionists,
  dialzara,
};

export const comparisonSlugs = Object.keys(comparisons);
