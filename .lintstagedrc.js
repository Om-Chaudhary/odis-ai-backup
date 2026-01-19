export default {
  // TypeScript files (excluding scripts directory)
  "*.{ts,tsx}": (files) => {
    const filteredFiles = files.filter((file) => !file.startsWith("scripts/"));
    if (filteredFiles.length === 0) return [];
    return [
      `eslint --fix ${filteredFiles.join(" ")}`,
      `prettier --write ${filteredFiles.join(" ")}`,
    ];
  },

  // JavaScript, JSON, and Markdown files (excluding scripts directory)
  "*.{js,jsx,json,md,mdx}": (files) => {
    const filteredFiles = files.filter((file) => !file.startsWith("scripts/"));
    if (filteredFiles.length === 0) return [];
    return [`prettier --write ${filteredFiles.join(" ")}`];
  },
};
