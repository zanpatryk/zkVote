"use client"
import { motion } from 'framer-motion'

export default function HowItWorks() {
  const steps = [
    { 
      step: "01", 
      title: "Zero-Knowledge Membership", 
      desc: "We use the Semaphore protocol to prove your eligibility without revealing your identity. You generate a local secret, and the blockchain verifies a Zero-Knowledge Proof that confirms 'I am a member of this group' without ever saying 'I am User X'. This breaks the link between your wallet address and your vote.",
      tech: "Semaphore / zk-SNARKs"
    },
    { 
      step: "02", 
      title: "ElGamal Homomorphic Encryption", 
      desc: "Your vote is never stored as plain text. Instead, it is encrypted using ElGamal encryption on your device. The magic of homomorphic encryption allows the smart contract to mathematically add these encrypted votes together—summing up the total—without ever decrypting the individual ballots.",
      tech: "Elliptic Curve Cryptography"
    },
    {
      step: "03",
      title: "Cryptographic Nullifiers", 
      desc: "To prevent double-voting without tracking users, we generate a unique 'nullifier' hash for each vote. If you try to vote again, the nullifier will be identical, and the smart contract will reject the proof. This guarantees the 'one person, one vote' principle while preserving total anonymity.",
      tech: "Poseidon Hash Function"
    },
    { 
      step: "04", 
      title: "Proof of Tally", 
      desc: "When the poll closes, the final encrypted sum is decrypted by the poll authority. However, to ensure they didn't fake the result, they must provide a Zero-Knowledge Proof (ZK-SNARK) that certifies: 'The decrypted result X mathematically corresponds to the encrypted sum Y'. This makes the tally mathematically verifiable by anyone.",
      tech: "Verifiable Decryption"
    },
    { 
      step: "05", 
      title: "Native On-Chain Execution", 
      desc: "Unlike other systems that use off-chain servers, zkVote runs entirely on the blockchain. Every registration, vote, and tally calculation is verifiable on-chain. There is no central server to trust, no hidden database, and no single point of failure.",
      tech: "Smart Contracts / EVM"
    }
  ]

  return (
    <div className="w-full max-w-5xl mb-24 font-serif">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-4xl font-black mb-16 text-center tracking-tight"
      >
        How It Works
      </motion.h2>
      
      <div className="space-y-8">
        {steps.map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col md:flex-row gap-8 items-start border-b-2 border-black pb-8 last:border-0"
          >
            <div className="md:w-1/4">
               <span className="text-6xl font-black text-gray-200 block -mb-4 opacity-50 select-none">{item.step}</span>
               <div className="inline-block bg-black text-white text-xs font-mono font-bold px-2 py-1 uppercase mt-4">
                  {item.tech}
               </div>
            </div>
            
            <div className="md:w-3/4">
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed text-lg max-w-2xl">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
