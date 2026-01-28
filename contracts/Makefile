# Usage:
#   make help
#   make start-anvil        # start anvil in background
#   make stop-anvil         # stop anvil started by start-anvil
#   make deploy             # deploy to local anvil (default)
#   make deploy-sepolia     # deploy to Sepolia (requires env vars)
#   make build test clean

ifneq (,$(wildcard .env))
include .env
export
endif

SCRIPT := script/DeployVotingSystem.s.sol:DeployVotingSystem
ANVIL_PORT := 8545
ANVIL_RPC := http://127.0.0.1:$(ANVIL_PORT)
ANVIL_RPC_DOCKER := http://host.docker.internal:$(ANVIL_PORT)
ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

.PHONY: help build test test-unit test-integration test-all clean start-anvil stop-anvil deploy deploy-anvil deploy-sepolia

help:
	@echo "Makefile targets:"
	@echo "  make start-anvil      - start anvil in background (writes anvil.pid)"
	@echo "  make stop-anvil       - kill anvil started by start-anvil"
	@echo "  make deploy           - run the Foundry script against local anvil"
	@echo "  make deploy-anvil     - run the Foundry script against local anvil (alias for deploy)"
	@echo "  make deploy-sepolia   - run the foundry script against Sepolia"
	@echo "  make build            - forge build"
	@echo "  make test             - run all tests (unit + integration without FFI)"
	@echo "  make test-unit        - run unit tests only"
	@echo "  make test-integration - run integration tests with FFI (requires circuit artifacts)"
	@echo "  make test-all         - run all tests including FFI integration tests"
	@echo "  make clean            - forge clean"
	@echo ""
	@echo "Benchmarks (Broadcast to Anvil):"
	@echo "  make benchmark-plain          - run plain voting benchmark"
	@echo "  make benchmark-zk             - run ZK voting benchmark"
	@echo "  make benchmark-semaphore-plain - run Semaphore (plain) benchmark"
	@echo "  make benchmark-semaphore-zk    - run Semaphore (ZK) benchmark"
	@echo ""
	@echo "Benchmarks (Dry Run / Simulation):"
	@echo "  make benchmark-plain-dry      - dry run plain voting benchmark"
	@echo "  make benchmark-zk-dry         - dry run ZK voting benchmark"
	@echo "  make benchmark-semaphore-plain-dry - dry run Semaphore (plain) benchmark"
	@echo "  make benchmark-semaphore-zk-dry    - dry run Semaphore (ZK) benchmark"

# Foundry helpers
build:
	forge build

test:
	forge test

test-unit:
	forge test --match-path "test/unit/*"

test-integration:
	forge test --match-path "test/integration/*"

test-all:
	forge test

clean:
	forge clean

# Start anvil in background, save PID in anvil.pid
start-anvil:
	@echo "Starting anvil on port $(ANVIL_PORT) (background)..."
	@nohup anvil -p $(ANVIL_PORT) --code-size-limit 120000 --gas-limit 100000000 > anvil.log 2>&1 & echo $$! > anvil.pid
	@echo "Anvil started (pid saved to anvil.pid). See anvil.log for output."

stop-anvil:
	@if [ -f anvil.pid ]; then \
		pid=$$(cat anvil.pid); \
		echo "Stopping anvil (pid $$pid)..."; \
		kill $$pid || true; \
		rm -f anvil.pid; \
		echo "Stopped."; \
	else \
		echo "No anvil.pid found. Is anvil running?"; \
	fi

# Deploy to local anvil
deploy:
	@echo "Deploying to local anvil at $(ANVIL_RPC) with key $(ANVIL_KEY)..."
	forge script $(SCRIPT) \
	  --rpc-url $(ANVIL_RPC) \
	  --private-key $(ANVIL_KEY) \
	  --broadcast

deploy-anvil: deploy

# ==============================================================================
# Benchmarks
# ==============================================================================

# Run all 4 benchmarks
benchmark: benchmark-plain benchmark-zk benchmark-semaphore-plain benchmark-semaphore-zk
	@echo "All benchmarks complete. Results in script/benchmark/results/"

benchmark-plain:
	@mkdir -p script/benchmark/results
	@echo "Running Plain benchmark..."
	PRIVATE_KEY=$(ANVIL_KEY) forge script script/benchmark/PlainBenchmark.s.sol:PlainBenchmark \
	  --non-interactive \
	  --rpc-url $(ANVIL_RPC) \
	  --private-key $(ANVIL_KEY) \
	  --broadcast \
	  --gas-price 2000000000 \
	  -vvvv

benchmark-plain-dry:
	@echo "Running Plain benchmark (dry-run)..."
	forge script script/benchmark/PlainBenchmark.s.sol:PlainBenchmark \
	  --non-interactive \
	  --rpc-url $(ANVIL_RPC) \
	  -vvvv

benchmark-zk:
	@mkdir -p script/benchmark/results
	@echo "Running ZK benchmark..."
	PRIVATE_KEY=$(ANVIL_KEY) forge script script/benchmark/ZKVoteBenchmark.s.sol:ZKVoteBenchmark \
	  --non-interactive \
	  --rpc-url $(ANVIL_RPC) \
	  --private-key $(ANVIL_KEY) \
	  --broadcast \
	  --gas-price 2000000000 \
	  -vvvv

benchmark-zk-dry:
	@echo "Running ZK benchmark (dry-run)..."
	PRIVATE_KEY=$(ANVIL_KEY) forge script script/benchmark/ZKVoteBenchmark.s.sol:ZKVoteBenchmark \
	  --non-interactive \
	  --rpc-url $(ANVIL_RPC) \
	  -vvvv

benchmark-semaphore-plain:
	@mkdir -p script/benchmark/results
	@echo "Running Semaphore Plain benchmark..."
	PRIVATE_KEY=$(ANVIL_KEY) forge script script/benchmark/SemaphorePlainBenchmark.s.sol:SemaphorePlainBenchmark \
	  --non-interactive \
	  --rpc-url $(ANVIL_RPC) \
	  --broadcast \
	  --gas-price 2000000000 \
	  -vvvv

benchmark-semaphore-plain-dry:
	@mkdir -p script/benchmark/results
	@echo "Running Semaphore Plain benchmark (dry-run)..."
	PRIVATE_KEY=$(ANVIL_KEY) forge script script/benchmark/SemaphorePlainBenchmark.s.sol:SemaphorePlainBenchmark \
	  --non-interactive \
	  --rpc-url $(ANVIL_RPC) \
	  -vvvv

benchmark-semaphore-zk:
	@mkdir -p script/benchmark/results
	@echo "Running Semaphore ZK benchmark..."
	PRIVATE_KEY=$(ANVIL_KEY) forge script script/benchmark/SemaphoreZKBenchmark.s.sol:SemaphoreZKBenchmark \
	  --non-interactive \
	  --rpc-url $(ANVIL_RPC) \
	  --broadcast \
	  --gas-price 2000000000 \
	  -vvvv

benchmark-semaphore-zk-dry:
	@mkdir -p script/benchmark/results
	@echo "Running Semaphore ZK benchmark (dry-run)..."
	PRIVATE_KEY=$(ANVIL_KEY) forge script script/benchmark/SemaphoreZKBenchmark.s.sol:SemaphoreZKBenchmark \
	  --non-interactive \
	  --rpc-url $(ANVIL_RPC) \
	  -vvvv

# Deploy to Sepolia (requires SEPOLIA_RPC_URL and PRIVATE_KEY set in env)
deploy-sepolia:
ifndef SEPOLIA_RPC_URL
	$(error SEPOLIA_RPC_URL is not set. export SEPOLIA_RPC_URL="https://...")
endif
ifndef PRIVATE_KEY
	$(error PRIVATE_KEY is not set. export PRIVATE_KEY="0x...")
endif
	@echo "Deploying to Sepolia via $(SEPOLIA_RPC_URL)..."
	FOUNDRY_PROFILE=sepolia forge script $(SCRIPT) \
	  --rpc-url $(SEPOLIA_RPC_URL) \
	  --private-key $(PRIVATE_KEY) \
	  --broadcast
