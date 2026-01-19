import { CONTRACT_ADDRESSES } from './addresses'
import VotingSystemEngineABI from './abis/VotingSystemEngine.json'
import SemaphoreEligibilityModuleABI from './abis/SemaphoreEligibilityModule.json'
import VoteStorageV0ABI from './abis/VoteStorageV0.json'
import EligibilityModuleV0ABI from './abis/EligibilityModuleV0.json'
import PollManagerABI from './abis/PollManager.json'
import ResultNFTABI from './abis/ResultNFT.json'
import IVoteStorageABI from './abis/IVoteStorage.json'
import ZKElGamalVoteVectorABI from './abis/ZKElGamalVoteVector.json'

// Export Contract Addresses for convenience
export { CONTRACT_ADDRESSES }
export const MODULE_ADDRESSES = CONTRACT_ADDRESSES

// Voting System Engine
export const votingSystemContract = {
  address: CONTRACT_ADDRESSES.vse,
  abi: VotingSystemEngineABI,
}

// Poll Manager
export const pollManagerContract = {
  address: CONTRACT_ADDRESSES.pollManager,
  abi: PollManagerABI,
}

// Semaphore Eligibility Module
export const semaphoreEligibilityContract = {
  address: CONTRACT_ADDRESSES.semaphoreEligibility,
  abi: SemaphoreEligibilityModuleABI,
}

// Eligibility Module V0 (Whitelist)
export const eligibilityModuleV0Contract = {
  address: CONTRACT_ADDRESSES.eligibilityV0,
  abi: EligibilityModuleV0ABI,
}

// Vote Storage V0
export const voteStorageContract = {
  address: CONTRACT_ADDRESSES.voteStorageV0,
  abi: VoteStorageV0ABI,
}

// Raw ABIs for dynamic interactions
export {
  PollManagerABI,
  SemaphoreEligibilityModuleABI,
  ResultNFTABI,
  IVoteStorageABI,
  VoteStorageV0ABI,
  EligibilityModuleV0ABI,
  ZKElGamalVoteVectorABI,
  VotingSystemEngineABI
}
