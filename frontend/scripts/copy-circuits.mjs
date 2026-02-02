import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = path.resolve(process.cwd(), '../circuits/build');
const TARGET_ROOT = path.join(process.cwd(), 'public', 'circuits');

const CIRCUIT_NAMES = [
  'elGamalVoteVector_N16',
  'elGamalTallyDecrypt_N16'
];

async function copyCircuits() {
  console.log('Copying specific circuit artifacts to public directory...');
  console.log(`Source: ${SOURCE_ROOT}`);
  console.log(`Target: ${TARGET_ROOT}`);

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`Error: Source directory ${SOURCE_ROOT} does not exist. Did you compile the circuits?`);
    process.exit(1);
  }

  // Create target root if not exists
  if (!fs.existsSync(TARGET_ROOT)) {
    fs.mkdirSync(TARGET_ROOT, { recursive: true });
  }

  for (const circuitName of CIRCUIT_NAMES) {
    const sourceCircuitDir = path.join(SOURCE_ROOT, circuitName);
    
    // Find JS directory (ends with _js)
    const subdirs = fs.readdirSync(sourceCircuitDir).filter(f => fs.statSync(path.join(sourceCircuitDir, f)).isDirectory());
    const jsDirName = subdirs.find(d => d.endsWith('_js'));
    const setupDir = path.join(sourceCircuitDir, 'setup');

    if (jsDirName && fs.existsSync(setupDir)) {
        console.log(`Processing ${circuitName}...`);
        
        const jsDir = path.join(sourceCircuitDir, jsDirName);

        // Target Naming Fix (e.g. elGamal -> elgamal for specific circuits)
        let targetName = circuitName;
        if (circuitName === 'elGamalVoteVector_N16') {
             targetName = 'elgamalVoteVector_N16'; 
        }

        const targetDir = path.join(TARGET_ROOT, targetName);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Copy WASM (find any .wasm in jsDir)
        const wasmFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.wasm'));
        if (wasmFiles.length > 0) {
             const wasmSource = path.join(jsDir, wasmFiles[0]);
             // Use circuitName or file name? Usually file name matches circuit.
             // But we want to ensure consistency. Let's use the file name found.
             // OR rename it to match targetName?
             // Use original filename to be safe, unless user code expects strict name.
             // step 101 of useZKVote.js: /.../elGamalVoteVector_N16.wasm
             // So we must ensure the file is named elGamalVoteVector_N16.wasm
             // If source is elGamalVoteVector_N16_N16.wasm (example), we might need to rename?
             // Step 8670 says: elGamalVoteVector_N16.wasm.
             // So filename is correct.
             const wasmDest = path.join(targetDir, wasmFiles[0]);
             fs.copyFileSync(wasmSource, wasmDest);
             console.log(`  Copied WASM: ${path.basename(wasmDest)}`);
        } else {
             console.warn(`  Warning: No .wasm found in ${jsDir}`);
        }

        // Copy ZKEY
        // Look for final zkey
        const finalZkeySource = path.join(setupDir, `${circuitName}_final.zkey`);
        const zkeyDest = path.join(targetDir, `${circuitName}_final.zkey`);
        
        if (fs.existsSync(finalZkeySource)) {
            fs.copyFileSync(finalZkeySource, zkeyDest);
            console.log(`  Copied ZKEY: ${path.basename(zkeyDest)}`);
        } else {
            // Fallback: search for any .zkey
            const zkeyFiles = fs.readdirSync(setupDir).filter(f => f.endsWith('.zkey'));
            if (zkeyFiles.length > 0) {
                 const bestZkey = zkeyFiles.find(f => f.includes('final')) || zkeyFiles[0];
                 fs.copyFileSync(path.join(setupDir, bestZkey), path.join(targetDir, bestZkey));
                 console.log(`  Copied ZKEY: ${bestZkey} (Fallback)`);
            } else {
                 console.warn(`  Warning: No .zkey found in ${setupDir}`);
            }
        }
        
        // Copy Verification Key
        const vkeySource = path.join(setupDir, `verification_key.json`);
        if (fs.existsSync(vkeySource)) {
            fs.copyFileSync(vkeySource, path.join(targetDir, `verification_key.json`));
            console.log(`  Copied VKey: verification_key.json`);
        }

    } else {
        // console.log(`Skipping ${circuitName} (No JS/Setup dir found)`);
    }
  }

  console.log('Done.');
}

copyCircuits().catch(err => {
    console.error(err);
    process.exit(1);
});
