#!/usr/bin/env tsx
/**
 * Update project.json files after moving to grouped structure
 * Updates: name, $schema path, sourceRoot, target cwd paths
 */

import * as fs from "fs";
import * as path from "path";

function findProjectJsonFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      files.push(...findProjectJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name === "project.json") {
      files.push(fullPath);
    }
  }
  return files;
}

// Mapping of old names to new names
const nameMapping: Record<string, string> = {
  // Shared
  types: "shared-types",
  validators: "shared-validators",
  constants: "shared-constants",
  ui: "shared-ui",
  hooks: "shared-hooks",
  styles: "shared-styles",
  logger: "shared-logger",
  crypto: "shared-crypto",
  testing: "shared-testing",
  utils: "shared-util",
  env: "shared-env",
  email: "shared-email",

  // Data Access
  api: "data-access-api",
  db: "data-access-db",

  // Integrations
  vapi: "integrations-vapi",
  idexx: "integrations-idexx",
  qstash: "integrations-qstash",
  resend: "integrations-resend",
  slack: "integrations-slack",
  ai: "integrations-ai",
  retell: "integrations-retell",

  // Domain
  "services-cases": "domain-cases-data-access",
  "services-discharge": "domain-discharge-data-access",
  "services-shared": "domain-shared-util",
  clinics: "domain-clinics-util",
  auth: "domain-auth-util",

  // Extension
  "extension-shared": "extension-shared",
  "extension-storage": "extension-storage",
  "extension-env": "extension-env",
};

function updateProjectConfigs() {
  // Find all project.json files in libs
  const projectFiles = findProjectJsonFiles("libs");

  console.log(`Found ${projectFiles.length} project.json files`);

  for (const projectFile of projectFiles) {
    const content = fs.readFileSync(projectFile, "utf-8");
    const config = JSON.parse(content);

    const oldName = config.name;
    const newName = nameMapping[oldName];

    if (!newName) {
      console.warn(`No mapping for ${oldName} in ${projectFile}`);
      continue;
    }

    // Calculate depth (how many levels deep from workspace root)
    const depth = projectFile.split("/").length - 2; // -2 for '.' and 'project.json'

    // Update name
    config.name = newName;

    // Update $schema path
    config.$schema = "../".repeat(depth) + "node_modules/nx/schemas/project-schema.json";

    // Update sourceRoot
    const libPath = path.dirname(projectFile);
    config.sourceRoot = `${libPath}/src`;

    // Update target cwd paths if they exist
    if (config.targets) {
      for (const [targetName, targetConfig] of Object.entries(config.targets)) {
        if (typeof targetConfig === "object" && targetConfig !== null && "options" in targetConfig) {
          const options = (targetConfig as any).options;
          if (options?.cwd) {
            options.cwd = libPath;
          }
        }
      }
    }

    // Write updated config
    fs.writeFileSync(projectFile, JSON.stringify(config, null, 2) + "\n");
    console.log(`✅ Updated ${oldName} → ${newName} (${projectFile})`);
  }

  console.log("\n✅ All project.json files updated!");
}

updateProjectConfigs();
