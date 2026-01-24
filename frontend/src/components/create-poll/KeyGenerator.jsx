import { motion } from 'framer-motion'
import { elgamal } from '@zkvote/lib'
import { toast } from 'react-hot-toast'

export default function KeyGenerator({ generatedKeys, setGeneratedKeys, hasSavedKey, setHasSavedKey }) {
  
  const handleGenerate = async () => {
    try {
      await elgamal.init()
      const keys = elgamal.generateKeyPair()
      const serializableKeys = {
          sk: keys.sk.toString(),
          pk: [keys.pk[0].toString(), keys.pk[1].toString()]
      }
      setGeneratedKeys(serializableKeys)
      toast.success('Encryption keys generated!')
    } catch (e) {
      console.error(e)
      toast.error('Failed to generate keys')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: 40 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="overflow-hidden pr-2 pb-2 -mr-2 -mb-2"
    >
      <div className="p-6 border-2 border-black bg-white rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-xl font-bold font-serif mb-2">Encryption Keys Required</h3>
        <p className="text-sm text-gray-600 mb-6">
          To decrypt the results later, you must generate and save a Secret Key now. 
          <br/>
          <span className="font-bold">If you lose this key, the poll results will be lost forever.</span>
        </p>

        {!generatedKeys ? (
          <button
            type="button"
            onClick={handleGenerate}
            className="bg-black text-white px-6 py-3 rounded-lg font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            Generate Encryption Keys
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Your Secret Key (SAVE THIS)</label>
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2">
                <code className="flex-1 bg-white p-3 border-2 border-black rounded text-sm font-mono break-all leading-tight">
                  {generatedKeys.sk}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKeys.sk)
                    toast.success('Copied to clipboard')
                  }}
                  className="w-full md:w-auto px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white rounded font-bold transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Public Key (Public)</label>
              <div className="mt-1 bg-gray-100 p-2 rounded text-xs font-mono text-gray-500 break-all">
                [{generatedKeys.pk[0]}, {generatedKeys.pk[1]}]
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <input 
                type="checkbox" 
                id="saveConfirm"
                checked={hasSavedKey}
                onChange={e => setHasSavedKey(e.target.checked)}
                className="w-5 h-5 accent-black border-2 border-black rounded cursor-pointer"
              />
              <label htmlFor="saveConfirm" className="text-sm font-bold cursor-pointer select-none">
                I have saved my secret key securely
              </label>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
