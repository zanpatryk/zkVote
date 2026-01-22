"use client"
import NFTCard from '@/components/NFTCard'

export default function UserDashboard({ nfts, loading }) {
  return (
    <div className="w-full max-w-5xl">
      <h2 className="text-4xl font-black font-serif mb-10 text-center border-b-2 border-black pb-6 tracking-tight">Your Voting Badges</h2>
      
      {loading ? (
         <p className="text-center text-gray-600 font-serif italic text-xl py-20">Loading badges...</p>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nfts.map((nft) => (
            <NFTCard key={nft.tokenId} nft={nft} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border-2 border-dashed border-gray-300">
          <p className="text-xl text-gray-500 font-serif italic">You haven't earned any badges yet. Participate in polls to earn them!</p>
        </div>
      )}
    </div>
  )
}
