const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CONFIG_PATH = path.join(__dirname, "../circuits.config.json");
const BUILD_DIR = path.join(__dirname, "../build");
// Output directory is packages/zkvote-lib/contracts
const OUT_DIR = path.join(__dirname, "../../packages/zkvote-lib/contracts");

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Load config
if (!fs.existsSync(CONFIG_PATH)) {
    console.error("Error: circuits.config.json not found");
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

console.log("=== Generating Solidity Verifiers ===\n");

// Get verifiers list (or all builds if no explicit verifiers list)
const builds = config.builds.verifiers || [];

if (builds.length === 0) {
    console.log("No verifiers configured in circuits.config.json");
    process.exit(0);
}

builds.forEach(build => {
    const { circuit, params } = build;
    const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}${v}`)
        .join("_");
    const buildName = `${circuit}_${paramStr}`;
    
    // Construct paths
    const zkeyPath = path.join(BUILD_DIR, buildName, "setup", `${buildName}_final.zkey`);
    const verifierName = `${circuit.charAt(0).toUpperCase() + circuit.slice(1)}Verifier_${paramStr}`;
    const outPath = path.join(OUT_DIR, `${verifierName}.sol`);

    if (!fs.existsSync(zkeyPath)) {
        console.error(`❌ zkey not found for ${buildName}. Skipping.`);
        return;
    }

    console.log(`Exporting ${verifierName}...`);

    try {
        // Run snarkjs command
        // We use npx snarkjs or assume it's in node_modules
        const cmd = `npx snarkjs zkey export solidityverifier "${zkeyPath}" "${outPath}"`;
        execSync(cmd, { stdio: "inherit" });

        // Read the generated file to change the contract name
        let content = fs.readFileSync(outPath, "utf8");
        // Default contract name is "Verifier" or "Groth16Verifier"
        // Replace "contract Verifier" with "contract CircuitNameVerifier"
        content = content.replace(/contract \w+Verifier/g, `contract ${verifierName}`);
        content = content.replace(/contract Verifier/g, `contract ${verifierName}`);
        
        fs.writeFileSync(outPath, content);
        
        console.log(`✓ Generated ${verifierName}.sol\n`);
    } catch (error) {
        console.error(`❌ Failed to generate verifier for ${buildName}: ${error.message}\n`);
    }
});

console.log(`=== Done! Verifiers written to ${OUT_DIR} ===`);
