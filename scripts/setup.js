const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI escape codes for styling
const colors = {
    reset: '\u001b[0m',
    bold: '\u001b[1m',
    green: '\u001b[32m',
    red: '\u001b[31m',
    yellow: '\u001b[33m',
    blue: '\u001b[34m',
    cyan: '\u001b[36m',
    gray: '\u001b[90m'
};

const icons = {
    pending: `${colors.gray}[WAIT]${colors.reset}`,
    success: `${colors.green}[DONE]${colors.reset}`,
    error: `${colors.red}[FAIL]${colors.reset}`,
    running: `${colors.blue}[RUN ]${colors.reset}`
};

const tasks = [
    { id: 'submodules', name: 'Update Git Submodules', cmd: 'git', args: ['submodule', 'update', '--init', '--recursive'] },
    { id: 'deps', name: 'Install Dependencies', cmd: 'bun', args: ['install'] },
    { id: 'circuits_build', name: 'Build Project ZK Circuits', cmd: 'bun', args: ['run', '--filter', 'circuits', 'build'] },
    { id: 'circuits_setup', name: 'Run ZK Trusted Setup', cmd: 'bun', args: ['run', '--filter', 'circuits', 'setup'] },
    { id: 'zkvote_lib_sync', name: 'Sync ZK Artifacts to Lib', cmd: 'bun', args: ['run', '--filter', '@zkvote/lib', 'sync:artifacts'] },
    { id: 'frontend_download', name: 'Download Semaphore Circuits', cmd: 'bun', args: ['run', '--filter', 'frontend', 'download:circuits'] },
    { id: 'contracts_install', name: 'Install Forge Dependencies', cmd: 'forge', args: ['install'], cwd: path.join(__dirname, '../contracts') },
    { id: 'contracts_build', name: 'Build Smart Contracts', cmd: 'make', args: ['build'], cwd: path.join(__dirname, '../contracts') }
];

let hasRendered = false;
let taskStatus = tasks.map(() => ({ status: 'pending', duration: null }));
let lastLines = [];
let isFinished = false;
let lastRenderedLines = 0; // Track how many lines were rendered last time

function render() {
    // Clear previous lines if we've rendered before
    if (hasRendered && lastRenderedLines > 0) {
        process.stdout.write(`\u001b[${lastRenderedLines}A`);
    }
    hasRendered = true;

    const clearLine = '\u001b[K';
    process.stdout.write(`${clearLine}\n`);
    process.stdout.write(`${clearLine}${colors.bold}${colors.cyan}zkVote Project Setup${colors.reset}\n`);
    process.stdout.write(`${clearLine}\n`);

    tasks.forEach((task, index) => {
        const state = taskStatus[index];
        let icon = icons.pending;
        if (state.status === 'running') icon = icons.running;
        else if (state.status === 'success') icon = icons.success;
        else if (state.status === 'error') icon = icons.error;

        let duration = '';
        if (state.duration !== null) {
            duration = `${colors.gray} (${(state.duration / 1000).toFixed(1)}s)${colors.reset}`;
        }

        process.stdout.write(`${clearLine}${icon} ${task.name}${duration}\n`);
    });

    if (!isFinished) {
        process.stdout.write(`${clearLine}\n`);
        process.stdout.write(`${clearLine}${colors.gray}--- Progress Preview ---${colors.reset}\n`);
        
        for (let i = 0; i < 5; i++) {
            const line = lastLines[i] || '';
            process.stdout.write(`${clearLine}${colors.gray}> ${line.substring(0, (process.stdout.columns || 80) - 5)}${colors.reset}\n`);
        }
    }

    // Track how many lines we rendered (3 header + tasks + preview if not finished)
    lastRenderedLines = 3 + tasks.length + (isFinished ? 0 : 7);
}

async function checkTools() {
    const tools = ['git', 'bun', 'make', 'forge', 'curl'];
    for (const tool of tools) {
        try {
            await new Promise((resolve, reject) => {
                const proc = spawn(tool, ['--version'], { stdio: 'ignore' });
                proc.on('close', (code) => code === 0 ? resolve() : reject());
                proc.on('error', reject);
            });
        } catch (e) {
            throw new Error(`Missing required tool: ${tool}. Please install it first.`);
        }
    }
}

async function runTask(task, index) {
    taskStatus[index].status = 'running';
    lastLines = [`Starting ${task.name}...`];
    render();

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const proc = spawn(task.cmd, task.args, {
            cwd: task.cwd || path.join(__dirname, '..'),
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const handleData = (data) => {
            const lines = data.toString().split('\n').filter(l => l.trim() !== '');
            if (lines.length > 0) {
                lastLines = [...lastLines, ...lines].slice(-5);
                render();
            }
        };

        proc.stdout.on('data', handleData);
        proc.stderr.on('data', handleData);

        proc.on('close', (code) => {
            taskStatus[index].duration = Date.now() - startTime;
            if (code === 0) {
                taskStatus[index].status = 'success';
                lastLines = [];
                resolve();
            } else {
                taskStatus[index].status = 'error';
                render(); // Final render for error icon
                reject(new Error(`Task "${task.name}" failed with code ${code}`));
            }
            render();
        });
    });
}

async function main() {
    console.log(`${colors.bold}${colors.cyan}Initializing Setup...${colors.reset}`);

    try {
        await checkTools();
        
        // Clear and start fresh render
        console.clear();
        render();
        
        for (let i = 0; i < tasks.length; i++) {
            await runTask(tasks[i], i);
        }

        isFinished = true;
        render();

        console.log(`\n${colors.bold}${colors.green}Setup completed successfully!${colors.reset}`);
        console.log(`${colors.cyan}You can now run the project with:${colors.reset} ${colors.bold}bun run dev:local${colors.reset}\n`);
    } catch (err) {
        isFinished = true;
        render();
        console.error(`\n${colors.bold}${colors.red}Setup failed!${colors.reset}`);
        console.error(`${colors.red}${err.message}${colors.reset}\n`);
        process.exit(1);
    }
}

main();
