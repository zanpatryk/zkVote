import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse depths from command line arguments
// Example: node download-circuits.mjs 20 25 32
const args = process.argv.slice(2);
const defaultDepths = Array.from({ length: 17 }, (_, i) => (i + 16).toString());
const DEPTHS = args.length > 0 ? args : defaultDepths;

// Base target directory: frontend/public/semaphore
const BASE_TARGET_DIR = path.join(process.cwd(), 'public', 'semaphore');

console.log(`Preparing to download circuits for depths: ${DEPTHS.join(', ')}`);

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
        console.log(`  File exists: ${path.basename(dest)} (Skipping)`);
        resolve();
        return;
    }

    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {}); // Setup cleanup
        reject(new Error(`Failed to download ${url}: Status Code ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`  Downloaded: ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const downloadForDepth = async (depth) => {
  const targetDir = path.join(BASE_TARGET_DIR, depth.toString());
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Processing Depth ${depth}...`);
  const urls = {
    wasm: `https://www.trusted-setup-pse.org/semaphore/${depth}/semaphore.wasm`,
    zkey: `https://www.trusted-setup-pse.org/semaphore/${depth}/semaphore.zkey`,
  };

  try {
    await downloadFile(urls.wasm, path.join(targetDir, 'semaphore.wasm'));
    await downloadFile(urls.zkey, path.join(targetDir, 'semaphore.zkey'));
  } catch (err) {
    console.error(`  Error downloading depth ${depth}:`, err.message);
    // Don't exit process, try next depth
  }
};

const main = async () => {
  for (const depth of DEPTHS) {
    await downloadForDepth(depth);
  }
  console.log('Circuit download process complete.');
};

main();
