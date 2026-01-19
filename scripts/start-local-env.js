const { spawn } = require('child_process');
const http = require('http');

const ANVIL_PORT = 8545;
const ANVIL_URL = `http://127.0.0.1:${ANVIL_PORT}`;

function log(prefix, data, isError = false) {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
        if (line.trim()) {
            const output = `[${prefix}] ${line}`;
            if (isError) console.error(output);
            else console.log(output);
        }
    });
}

async function waitForAnvil() {
    console.log(`[Setup] Waiting for Anvil to be ready at ${ANVIL_URL}...`);
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            const req = http.request(ANVIL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
                if (res.statusCode === 200 || res.statusCode === 405 || res.statusCode === 400) { // 405/400 generic response means it's listening
                    clearInterval(interval);
                    console.log('[Setup] Anvil is ready!');
                    resolve();
                }
            });
            req.on('error', () => {}); // Ignore errors, just retry
            req.write(JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }));
            req.end();
        }, 1000);
    });
}

async function start() {
    // 1. Start Anvil
    console.log('[Setup] Starting Anvil...');
    const anvil = spawn('bun', ['run', 'dev:chain'], { stdio: ['ignore', 'pipe', 'pipe'] });
    anvil.stdout.on('data', d => log('Anvil', d));
    anvil.stderr.on('data', d => log('Anvil', d));

    // Cleanup on exit
    process.on('SIGINT', () => {
        console.log('\n[Setup] Stopping processes...');
        anvil.kill();
        process.exit();
    });

    await waitForAnvil();

    // 2. Deploy Contracts
    console.log('[Setup] Deploying contracts...');
    const deploy = spawn('bun', ['run', 'deploy:local'], { stdio: 'inherit' });
    
    await new Promise((resolve, reject) => {
        deploy.on('close', (code) => {
            if (code === 0) {
                console.log('[Setup] Contracts deployed successfully!');
                resolve();
            } else {
                console.error(`[Setup] Contracts deployment failed with code ${code}`);
                anvil.kill();
                process.exit(code);
            }
        });
    });

    // 3. Start Frontend
    console.log('[Setup] Starting Frontend...');
    const frontend = spawn('bun', ['run', 'dev:frontend'], { stdio: 'inherit' });
    
    frontend.on('close', (code) => {
        console.log(`[Setup] Frontend exited with code ${code}`);
        anvil.kill();
        process.exit(code);
    });
}

start();
