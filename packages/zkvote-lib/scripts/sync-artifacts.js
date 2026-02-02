import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIB_ROOT = path.join(__dirname, '..');
const PROJECT_ROOT = path.join(LIB_ROOT, '../..');
const CIRCUITS_BUILD = path.join(PROJECT_ROOT, 'circuits/build');
const ARTIFACTS_DIR = path.join(LIB_ROOT, 'artifacts');

async function main() {
    console.log(`Syncing ZK artifacts to ${ARTIFACTS_DIR}...`);

    if (!fs.existsSync(CIRCUITS_BUILD)) {
        console.warn(`Warning: Circuits build directory not found at ${CIRCUITS_BUILD}`);
        console.warn('Run "bun run build:circuits" first.');
        process.exit(0); // Don't fail setup, just skip
    }

    try {
        // Remove existing link/file if it exists
        if (fs.existsSync(ARTIFACTS_DIR) || fs.lstatSync(ARTIFACTS_DIR, { throwIfNoEntry: false })) {
            const stats = fs.lstatSync(ARTIFACTS_DIR);
            if (stats.isSymbolicLink() || stats.isFile()) {
                fs.unlinkSync(ARTIFACTS_DIR);
            } else if (stats.isDirectory()) {
                fs.rmSync(ARTIFACTS_DIR, { recursive: true });
            }
        }

        // Create symlink
        // Note: Using relative path for the symlink makes it more portable within the repo
        const relativeTarget = path.relative(LIB_ROOT, CIRCUITS_BUILD);
        fs.symlinkSync(relativeTarget, ARTIFACTS_DIR, 'junction'); 
        
        console.log(`✓ Created symlink: artifacts -> ${relativeTarget}`);
    } catch (err) {
        console.error(`Error creating symlink: ${err.message}`);
        process.exit(1);
    }
}

main();
