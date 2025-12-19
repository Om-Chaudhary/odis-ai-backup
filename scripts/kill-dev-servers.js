#!/usr/bin/env node

/**
 * Kill dev servers and Nx processes
 * Usage: node scripts/kill-dev-servers.js
 *
 * This script kills:
 * - Processes on port 3000 (default Next.js dev port)
 * - Processes on port 3001 (fallback dev port)
 * - All Nx daemon processes
 * - All node processes that might be hanging
 */

import { execSync } from "child_process";

const ports = [3000, 3001];
const processPatterns = ["nx", "node"];

function killProcessOnPort(port) {
  try {
    console.log(`🔍 Looking for processes on port ${port}...`);
    const command = `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
    execSync(command, { stdio: "inherit", shell: "/bin/bash" });
    console.log(`✅ Killed processes on port ${port}`);
  } catch (error) {
    console.log(`ℹ️  No processes found on port ${port}`);
  }
}

function killNxDaemon() {
  try {
    console.log(`🔍 Killing Nx daemon...`);
    execSync("nx reset", { stdio: "inherit" });
    console.log(`✅ Nx daemon reset`);
  } catch (error) {
    console.log(`ℹ️  No Nx daemon to kill`);
  }
}

function killHangingProcesses() {
  try {
    console.log(`🔍 Looking for hanging Node/Nx processes...`);
    const command = `ps aux | grep -E '(node|nx)' | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true`;
    execSync(command, { stdio: "inherit", shell: "/bin/bash" });
    console.log(`✅ Killed hanging processes`);
  } catch (error) {
    console.log(`ℹ️  No hanging processes found`);
  }
}

console.log("\n🚀 Killing development servers...\n");

ports.forEach(killProcessOnPort);
killNxDaemon();
killHangingProcesses();

console.log("\n✨ All dev servers killed! Ready to run pnpm dev again.\n");
