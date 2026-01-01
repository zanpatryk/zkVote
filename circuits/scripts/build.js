const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SRC_DIR = path.join(__dirname, "../src");
const BUILD_DIR = path.join(__dirname, "../build");
const NODE_MODULES = path.join(__dirname, "../../node_modules");

if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR);
}

const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith(".circom"));

console.log("=== Compiling Circuits ===\n");

files.forEach(file => {
    const filename = path.basename(file, ".circom");
    const filePath = path.join(SRC_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes("component main")) {
        console.log(`Compiling: ${file}...`);
        const outDir = path.join(BUILD_DIR, filename);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        try {
            execSync(
                `circom "${filePath}" --r1cs --wasm --sym -l "${NODE_MODULES}" -o "${outDir}"`,
                { stdio: "inherit" }
            );
            console.log(`✓ ${filename} compiled successfully\n`);
        } catch (error) {
            console.error(`❌ Failed to compile ${file}\n`);
            process.exit(1);
        }
    } else {
        console.log(`Skipping library file: ${file}`);
    }
});

console.log("=== Build Complete ===");
