import { getAddresses, CONTRACT_ADDRESSES } from './addresses'
import VotingSystemEngineABI from './abis/VotingSystemEngine.json'
import SemaphoreEligibilityModuleABI from './abis/SemaphoreEligibilityModule.json'
import VoteStorageV0ABI from './abis/VoteStorageV0.json'
import EligibilityModuleV0ABI from './abis/EligibilityModuleV0.json'
import PollManagerABI from './abis/PollManager.json'
import ResultNFTABI from './abis/ResultNFT.json'
import IVoteStorageABI from './abis/IVoteStorage.json'
import ZKElGamalVoteVectorABI from './abis/ZKElGamalVoteVector.json'

// Export Contract Addresses for convenience
export { getAddresses, CONTRACT_ADDRESSES }
export const MODULE_ADDRESSES = CONTRACT_ADDRESSES

// Voting System Engine
export const votingSystemContract = {
  abi: VotingSystemEngineABI,
}

// Poll Manager
export const pollManagerContract = {
  abi: PollManagerABI,
}

// Semaphore Eligibility Module
export const semaphoreEligibilityContract = {
  abi: SemaphoreEligibilityModuleABI,
}

// Eligibility Module V0 (Whitelist)
export const eligibilityModuleV0Contract = {
  abi: EligibilityModuleV0ABI,
}

// Vote Storage V0
export const voteStorageContract = {
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
