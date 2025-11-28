# Usage:
#   make help
#   make start-anvil        # start anvil in background
#   make stop-anvil         # stop anvil started by start-anvil
#   make deploy-anvil       # deploy to local anvil
#   make deploy-sepolia     # deploy to Sepolia (requires env vars)
#   make build test clean

SCRIPT := script/DeployVotingSystem.s.sol:DeployVotingSystem
ANVIL_PORT := 8545
ANVIL_RPC := http://127.0.0.1:$(ANVIL_PORT)
ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

.PHONY: help build test clean start-anvil stop-anvil deploy-anvil deploy-sepolia

help:
	@echo "Makefile targets:"
	@echo "  make start-anvil     - start anvil in background (writes anvil.pid)"
	@echo "  make stop-anvil      - kill anvil started by start-anvil"
	@echo "  make deploy-anvil    - run the Foundry script against local anvil"
	@echo "  make deploy-sepolia  - run the Foundry script against Sepolia (needs SEPOLIA_RPC_URL and PRIVATE_KEY env vars)"
	@echo "  make build           - forge build"
	@echo "  make test            - forge test"
	@echo "  make clean           - forge clean"

# Foundry helpers
build:
	forge build

test:
	forge test

clean:
	forge clean

# Start anvil in background, save PID in anvil.pid
start-anvil:
	@echo "Starting anvil on port $(ANVIL_PORT) (background)..."
	@nohup anvil -p $(ANVIL_PORT) > anvil.log 2>&1 & echo $$! > anvil.pid
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
deploy-anvil:
	@echo "Deploying to local anvil at $(ANVIL_RPC) with key $(ANVIL_KEY)..."
	forge script $(SCRIPT) \
	  --rpc-url $(ANVIL_RPC) \
	  --private-key $(ANVIL_KEY) \
	  --broadcast

# Deploy to Sepolia (requires SEPOLIA_RPC_URL and PRIVATE_KEY set in env)
deploy-sepolia:
ifndef SEPOLIA_RPC_URL
	$(error SEPOLIA_RPC_URL is not set. export SEPOLIA_RPC_URL="https://...")
endif
ifndef PRIVATE_KEY
	$(error PRIVATE_KEY is not set. export PRIVATE_KEY="0x...")
endif
	@echo "Deploying to Sepolia via $(SEPOLIA_RPC_URL)..."
	forge script $(SCRIPT) \
	  --rpc-url $(SEPOLIA_RPC_URL) \
	  --private-key $(PRIVATE_KEY) \
	  --broadcast
