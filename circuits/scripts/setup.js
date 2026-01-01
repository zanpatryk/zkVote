const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CIRCUIT_NAME = "secretVote";
const BUILD_DIR = path.join(__dirname, `../build/${CIRCUIT_NAME}`);
const SETUP_DIR = path.join(BUILD_DIR, "setup");
// Use pot17 for circuits with > 65536 constraints
const PTAU_URL = "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_17.ptau";

function downloadFile(url, dest) {
    console.log("Downloading from:", url);
    execSync(`curl -L -o "${dest}" "${url}"`, { stdio: "inherit" });
}

async function setup() {
    console.log("=== Trusted Setup for", CIRCUIT_NAME, "===\n");

    // Create setup directory
    if (!fs.existsSync(SETUP_DIR)) {
        fs.mkdirSync(SETUP_DIR, { recursive: true });
    }

    const r1csPath = path.join(BUILD_DIR, `${CIRCUIT_NAME}.r1cs`);
    const ptauPath = path.join(SETUP_DIR, "pot17_final.ptau");
    const zkey0Path = path.join(SETUP_DIR, `${CIRCUIT_NAME}_0000.zkey`);
    const zkeyFinalPath = path.join(SETUP_DIR, `${CIRCUIT_NAME}_final.zkey`);
    const vkeyPath = path.join(SETUP_DIR, "verification_key.json");

    // Check if r1cs exists
    if (!fs.existsSync(r1csPath)) {
        console.error("❌ Circuit not compiled! Run 'bun run build:circuits' first.");
        process.exit(1);
    }

    // Download Powers of Tau if needed
    if (!fs.existsSync(ptauPath)) {
        console.log("Downloading Powers of Tau (this may take a minute)...");
        downloadFile(PTAU_URL, ptauPath);
        console.log("✓ Downloaded ptau file\n");
    } else {
        console.log("✓ Using existing ptau file\n");
    }

    // Generate initial zkey
    console.log("Generating zkey (phase 2 setup)...");
    await snarkjs.zKey.newZKey(r1csPath, ptauPath, zkey0Path);
    
    // Verify zkey was created properly
    if (!fs.existsSync(zkey0Path)) {
        console.error("❌ zkey file was not created!");
        process.exit(1);
    }
    const zkeySize = fs.statSync(zkey0Path).size;
    console.log(`✓ Initial zkey created (${Math.round(zkeySize / 1024 / 1024)} MB)\n`);

    // Contribute to zkey (adds randomness)
    console.log("Contributing randomness to zkey...");
    await snarkjs.zKey.contribute(zkey0Path, zkeyFinalPath, "Test Contributor", "random entropy string " + Date.now());
    console.log("✓ Contribution added\n");

    // Export verification key
    console.log("Exporting verification key...");
    const vkey = await snarkjs.zKey.exportVerificationKey(zkeyFinalPath);
    fs.writeFileSync(vkeyPath, JSON.stringify(vkey, null, 2));
    console.log("✓ Verification key exported\n");

    // Cleanup intermediate zkey
    fs.unlinkSync(zkey0Path);

    console.log("=== Setup Complete ===");
    console.log("zkey:             ", zkeyFinalPath);
    console.log("verification_key: ", vkeyPath);

    process.exit(0);
}

setup().catch(err => {
    console.error("Setup failed:", err.message);
    process.exit(1);
});
