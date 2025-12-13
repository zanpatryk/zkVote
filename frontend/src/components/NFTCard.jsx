'use client'

export default function NFTCard({ nft }) {
  return (
    <div className="border border-black rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition">
      <h3 className="text-xl font-bold mb-2">{nft.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{nft.description}</p>
      
      {nft.attributes && (
        <div className="space-y-2">
            {nft.attributes.map((attr, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="font-semibold">{attr.trait_type}:</span>
                <span>{attr.value}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
