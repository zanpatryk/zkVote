import * as read from '@/lib/blockchain/engine/read'
import * as write from '@/lib/blockchain/engine/write'

describe('Blockchain Engine Public API', () => {
  describe('read.js exports', () => {
    it('should export core module discovery functions', () => {
      expect(read.getModules).toBeDefined()
    })
    
    it('should export all domain-specific read functions', () => {
      // Polls
      expect(read.getPollById).toBeDefined()
      expect(read.getOwnedPolls).toBeDefined()
      expect(read.getWhitelistedPolls).toBeDefined()
      
      // Members
      expect(read.getWhitelistedAddresses).toBeDefined()
      expect(read.getMerkleTreeDepth).toBeDefined()
      expect(read.getGroupMembers).toBeDefined()
      expect(read.hasVoted).toBeDefined()
      expect(read.isUserWhitelisted).toBeDefined()
      
      // Voting
      expect(read.getVote).toBeDefined()
      expect(read.getPollVotes).toBeDefined()
      expect(read.getZKPollState).toBeDefined()
      
      // NFTs
      expect(read.getUserNFTs).toBeDefined()
    })
  })

  describe('write.js exports', () => {
    it('should export all domain-specific write functions', () => {
      // Polls
      expect(write.createPoll).toBeDefined()
      expect(write.startPoll).toBeDefined()
      expect(write.endPoll).toBeDefined()
      
      // Members
      expect(write.whitelistUser).toBeDefined()
      expect(write.whitelistUsers).toBeDefined()
      expect(write.addMember).toBeDefined()
      
      // Voting
      expect(write.castVote).toBeDefined()
      expect(write.castVoteWithProof).toBeDefined()
      expect(write.castEncryptedVote).toBeDefined()
      
      // NFTs
      expect(write.mintResultNFT).toBeDefined()
    })
  })
})
