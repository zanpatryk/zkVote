import localAddresses from './address.json'

// Priority: Environment Variables > address.json
export const CONTRACT_ADDRESSES = {
  vse: process.env.NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS || localAddresses.vse,
  pollManager: process.env.NEXT_PUBLIC_POLL_MANAGER_ADDRESS || localAddresses.pollManager,
  semaphoreEligibility: process.env.NEXT_PUBLIC_SEMAPHORE_ELIGIBILITY_ADDRESS || localAddresses.semaphoreEligibility,
  eligibilityV0: process.env.NEXT_PUBLIC_ELIGIBILITY_V0_ADDRESS || localAddresses.eligibilityV0,
  voteStorageV0: process.env.NEXT_PUBLIC_VOTE_STORAGE_V0_ADDRESS || localAddresses.voteStorageV0,
  zkElGamalVoteVector: process.env.NEXT_PUBLIC_ZK_ELGAMAL_VOTE_VECTOR_ADDRESS || localAddresses.zkElGamalVoteVector,
  elgamalVoteVerifier: process.env.NEXT_PUBLIC_ELGAMAL_VOTE_VERIFIER_ADDRESS || localAddresses.elgamalVoteVerifier,
  elgamalTallyVerifier: process.env.NEXT_PUBLIC_ELGAMAL_TALLY_VERIFIER_ADDRESS || localAddresses.elgamalTallyVerifier,
}

export default CONTRACT_ADDRESSES
