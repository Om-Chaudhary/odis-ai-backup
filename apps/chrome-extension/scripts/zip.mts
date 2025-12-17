import { resolve, dirname } from 'node:path';
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync, createReadStream, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const workspaceRoot = resolve(rootDir, '..', '..');
const distDir = resolve(workspaceRoot, 'dist', 'apps', 'chrome-extension');
const outputDir = resolve(rootDir, 'releases');

async function createZip() {
  if (!existsSync(distDir)) {
    console.error(`Build directory not found: ${distDir}`);
    console.error('Please run "nx build chrome-extension" first.');
    process.exit(1);
  }

  mkdirSync(outputDir, { recursive: true });

  // Read version from package.json
  let version = '0.0.0';
  try {
    const packageJsonPath = resolve(workspaceRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    version = packageJson.version || '0.0.0';
  } catch {
    console.warn('Could not read version from package.json, using default');
  }
  const zipFileName = `chrome-extension-v${version}.zip`;
  const zipPath = resolve(outputDir, zipFileName);

  const output = createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  output.on('close', () => {
    console.log(`Extension packaged: ${zipPath}`);
    console.log(`Total bytes: ${archive.pointer()}`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(distDir, false);
  await archive.finalize();
}

createZip().catch((error) => {
  console.error('Zip creation failed:', error);
  process.exit(1);
});
