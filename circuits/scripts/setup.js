const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CONFIG_PATH = path.join(__dirname, "../circuits.config.json");

// PTAU files by power (pot17 = 2^17 = 131K constraints, pot18 = 2^18 = 262K, etc.)
const PTAU_BASE_URL = "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_";

function downloadFile(url, dest) {
    console.log("Downloading from:", url);
    execSync(`curl -L -o "${dest}" "${url}"`, { stdio: "inherit" });
}

function getPtauPower(constraints) {
    // Find minimum power of 2 that can handle the constraints
    let power = 10;
    while ((1 << power) < constraints && power < 28) {
        power++;
    }
    return Math.max(power, 14); // Minimum pot14
}

async function setupCircuit(buildName) {
    const BUILD_DIR = path.join(__dirname, `../build/${buildName}`);
    const SETUP_DIR = path.join(BUILD_DIR, "setup");

    console.log(`\n=== Trusted Setup for ${buildName} ===\n`);

    // Create setup directory
    if (!fs.existsSync(SETUP_DIR)) {
        fs.mkdirSync(SETUP_DIR, { recursive: true });
    }

    const r1csPath = path.join(BUILD_DIR, `${buildName}.r1cs`);
    const zkey0Path = path.join(SETUP_DIR, `${buildName}_0000.zkey`);
    const zkeyFinalPath = path.join(SETUP_DIR, `${buildName}_final.zkey`);
    const vkeyPath = path.join(SETUP_DIR, "verification_key.json");

    // Check if r1cs exists
    if (!fs.existsSync(r1csPath)) {
        console.error(`❌ Circuit ${buildName} not compiled! Run 'bun run build' first.`);
        return false;
    }

    // Get constraint count from r1cs to determine needed PTAU
    const r1csInfo = await snarkjs.r1cs.info(r1csPath);
    const constraints = r1csInfo.nConstraints;
    const ptauPower = getPtauPower(constraints);
    const ptauPath = path.join(SETUP_DIR, `pot${ptauPower}_final.ptau`);
    const ptauUrl = `${PTAU_BASE_URL}${ptauPower}.ptau`;

    console.log(`Constraints: ${constraints.toLocaleString()}, using pot${ptauPower}`);

    // Download Powers of Tau if needed
    if (!fs.existsSync(ptauPath)) {
        console.log("Downloading Powers of Tau (this may take a minute)...");
        downloadFile(ptauUrl, ptauPath);
        console.log("✓ Downloaded ptau file\n");
    } else {
        console.log("✓ Using existing ptau file\n");
    }

    // Generate initial zkey
    console.log("Generating zkey (phase 2 setup)...");
    await snarkjs.zKey.newZKey(r1csPath, ptauPath, zkey0Path);

    if (!fs.existsSync(zkey0Path)) {
        console.error("❌ zkey file was not created!");
        return false;
    }
    const zkeySize = fs.statSync(zkey0Path).size;
    console.log(`✓ Initial zkey created (${Math.round(zkeySize / 1024 / 1024)} MB)\n`);

    // Contribute to zkey
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

    return true;
}

async function main() {
    // Check for single circuit mode (backward compatible)
    if (process.argv.length >= 3) {
        const circuitName = process.argv[2];
        console.log(`Setting up single circuit: ${circuitName}`);
        const success = await setupCircuit(circuitName);
        process.exit(success ? 0 : 1);
    }

    // Setup all circuits from config
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error("Error: circuits.config.json not found");
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    console.log("=== Setting Up All Circuits from Config ===\n");

    // Flatten grouped builds into a single array
    const allBuilds = [];
    for (const group in config.builds) {
        config.builds[group].forEach(build => {
            allBuilds.push({ ...build, group });
        });
    }

    for (const build of allBuilds) {
        const { circuit, params } = build;
        const paramStr = Object.entries(params)
            .map(([k, v]) => `${k}${v}`)
            .join("_");
        const buildName = `${circuit}_${paramStr}`;

        const success = await setupCircuit(buildName);
        if (!success) {
            console.error(`\n❌ Setup failed for ${buildName}`);
            process.exit(1);
        }
    }

    console.log("\n=== All Setups Complete ===");
    process.exit(0);
}

main().catch(err => {
    console.error("Setup failed:", err.message);
    process.exit(1);
});
