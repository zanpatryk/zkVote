const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SRC_DIR = path.join(__dirname, "../src");
const BUILD_DIR = path.join(__dirname, "../build");
const NODE_MODULES = path.join(__dirname, "../../node_modules");
const CONFIG_PATH = path.join(__dirname, "../circuits.config.json");

if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR);
}

// Load config
let config;
if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
} else {
    console.error("Error: circuits.config.json not found");
    process.exit(1);
}

console.log("=== Compiling Circuits ===\n");

// Flatten grouped builds into a single array
const allBuilds = [];
for (const group in config.builds) {
    config.builds[group].forEach(build => {
        allBuilds.push({ ...build, group });
    });
}

allBuilds.forEach(build => {
    const { circuit, params } = build;
    const srcPath = path.join(SRC_DIR, `${circuit}.circom`);

    if (!fs.existsSync(srcPath)) {
        console.error(`Error: ${circuit}.circom not found`);
        process.exit(1);
    }

    // Generate build name with params
    const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}${v}`)
        .join("_");
    const buildName = `${circuit}_${paramStr}`;

    console.log(`Compiling: ${circuit} with ${JSON.stringify(params)} -> ${buildName}`);

    // Read source and modify main component
    let content = fs.readFileSync(srcPath, "utf8");

    // Replace main component params
    // Match: component main {public [...]} = TemplateName(...)
    const mainRegex = /component main\s*(\{[^}]*\})?\s*=\s*(\w+)\s*\([^)]*\)/;
    const match = content.match(mainRegex);

    if (!match) {
        console.error(`Error: No main component found in ${circuit}.circom`);
        process.exit(1);
    }

    const publicDecl = match[1] || "";
    const templateName = match[2];

    // Build param list from config
    const paramValues = Object.values(params).join(", ");
    const newMain = `component main ${publicDecl} = ${templateName}(${paramValues})`;

    content = content.replace(mainRegex, newMain);

    // Write modified source to temp file
    const tempSrc = path.join(SRC_DIR, `_temp_${circuit}.circom`);
    fs.writeFileSync(tempSrc, content);

    // Create output directory
    const outDir = path.join(BUILD_DIR, buildName);
    if (fs.existsSync(outDir)) {
        // Clean up old build files except setup directory
        const oldFiles = fs.readdirSync(outDir);
        oldFiles.forEach(file => {
            if (file !== "setup") {
                const filePath = path.join(outDir, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    fs.rmSync(filePath, { recursive: true });
                } else {
                    fs.unlinkSync(filePath);
                }
            }
        });
    } else {
        fs.mkdirSync(outDir, { recursive: true });
    }

    try {
        execSync(
            `circom "${tempSrc}" --r1cs --wasm --sym -l "${NODE_MODULES}" -o "${outDir}"`,
            { stdio: "inherit" }
        );

        // Rename output files to match build name
        const tempName = `_temp_${circuit}`;

        // Handle JS folder and wasm rename first
        const jsDir = path.join(outDir, `${tempName}_js`);
        if (fs.existsSync(jsDir)) {
            // First rename wasm file inside (while still in old folder)
            const wasmOld = path.join(jsDir, `${tempName}.wasm`);
            const wasmNew = path.join(jsDir, `${buildName}.wasm`);
            if (fs.existsSync(wasmOld)) {
                fs.renameSync(wasmOld, wasmNew);
            }
            // Then rename the folder
            const newJsDir = path.join(outDir, `${buildName}_js`);
            fs.renameSync(jsDir, newJsDir);
        }

        // Rename other output files (r1cs, sym)
        const files = fs.readdirSync(outDir);
        files.forEach(file => {
            if (file.includes(tempName)) {
                const newName = file.replace(tempName, buildName);
                fs.renameSync(path.join(outDir, file), path.join(outDir, newName));
            }
        });

        console.log(`✓ ${buildName} compiled successfully\n`);
    } catch (error) {
        console.error(`❌ Failed to compile ${buildName}\n`);
        process.exit(1);
    } finally {
        // Cleanup temp file
        if (fs.existsSync(tempSrc)) {
            fs.unlinkSync(tempSrc);
        }
    }
});

console.log("=== Build Complete ===");
