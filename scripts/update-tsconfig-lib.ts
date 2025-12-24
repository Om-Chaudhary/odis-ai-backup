#!/usr/bin/env tsx
/**
 * Update tsconfig.lib.json files to fix relative paths after moving to grouped structure
 */

import * as fs from "fs";
import * as path from "path";

function findTsConfigLibFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      files.push(...findTsConfigLibFiles(fullPath));
    } else if (entry.isFile() && entry.name === "tsconfig.lib.json") {
      files.push(fullPath);
    }
  }
  return files;
}

function updateTsConfigLibFiles() {
  const tsconfigFiles = findTsConfigLibFiles("libs");

  console.log(`Found ${tsconfigFiles.length} tsconfig.lib.json files\n`);

  for (const tsconfigFile of tsconfigFiles) {
    const content = fs.readFileSync(tsconfigFile, "utf-8");
    const config = JSON.parse(content);

    // Calculate depth from workspace root
    const depth = tsconfigFile.split("/").length - 2; // -2 for '.' and filename

    // Update extends path
    const extendsPath = "../".repeat(depth) + "tsconfig.base.json";
    config.extends = extendsPath;

    // Update outDir path if it exists
    if (config.compilerOptions?.outDir) {
      config.compilerOptions.outDir = "../".repeat(depth) + "dist/out-tsc";
    }

    // Write updated config
    fs.writeFileSync(tsconfigFile, JSON.stringify(config, null, 2) + "\n");
    console.log(`✅ Updated ${tsconfigFile} (depth: ${depth})`);
  }

  console.log(`\n✅ All ${tsconfigFiles.length} tsconfig.lib.json files updated!`);
}

updateTsConfigLibFiles();
