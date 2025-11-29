import VotingSystemEngineABI from './abis/VotingSystemEngine.json'

export const VOTING_SYSTEM_ADDRESS = process.env.NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS

export const votingSystemContract = {
  address: VOTING_SYSTEM_ADDRESS,
  abi: VotingSystemEngineABI,
}
