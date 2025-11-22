#!/usr/bin/env bun
import fs from "fs";
import path from "path";

const artifactsDir = path.join(import.meta.dir, "../contracts/out");
const targetDir = path.join(import.meta.dir, "../frontend/src/contracts/abis");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const contracts = fs.readdirSync(artifactsDir).filter(f => f.endsWith(".sol"));

for (const contractDir of contracts) {
  const dirPath = path.join(artifactsDir, contractDir);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".json"));

  for (const file of files) {
    if (file.includes(".t.sol") || file.includes("Script")) continue;

    const artifact = JSON.parse(fs.readFileSync(path.join(dirPath, file), "utf8"));
    if (artifact.abi && artifact.abi.length > 0) {
      const name = file.replace(".json", "");
      fs.writeFileSync(
        path.join(targetDir, `${name}.json`),
        JSON.stringify(artifact.abi, null, 2)
      );
      console.log(`Generated ABI: ${name}`);
    }
  }
}
