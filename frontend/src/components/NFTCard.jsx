'use client'

export default function NFTCard({ nft }) {
  return (
    <div className="border-2 border-black rounded-lg p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300">
      <h3 className="text-xl font-serif font-bold mb-2">{nft.name}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{nft.description}</p>
      
      {nft.attributes && (
        <div className="space-y-2 pt-4 border-t-2 border-black/5">
            {nft.attributes.map((attr, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="font-bold font-serif text-gray-500">{attr.trait_type}</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{attr.value}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
