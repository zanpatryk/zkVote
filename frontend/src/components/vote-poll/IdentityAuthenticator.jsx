export default function IdentityAuthenticator({ 
  onRegenerateIdentity, 
  onFileUpload, 
  isLoading, 
  isUploading 
}) {
  return (
    <div className="bg-white border-2 border-black p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-6">
      <h2 className="text-2xl font-bold font-serif">Authenticate Identity</h2>
      <p className="text-gray-600">
        To cast a vote, authenticate using your wallet or upload your identity backup file.
      </p>
      
       <div className="flex flex-col gap-4">
          {/* Primary: Wallet-based regeneration */}
          <button 
            onClick={onRegenerateIdentity}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all w-full disabled:opacity-70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
            {isLoading ? 'Signing...' : 'Sign with Wallet'}
          </button>

          <div className="text-gray-400 text-sm">or</div>

          {/* Secondary: JSON file upload */}
          <div className="relative">
            <input 
              type="file" 
              accept=".json"
              onChange={onFileUpload}
              disabled={isUploading}
              className="hidden"
              id="identity-upload"
              data-testid="identity-upload"
            />
            <label 
              htmlFor="identity-upload"
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold transition-all w-full bg-white border-2 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
            >
              {isUploading ? 'Verifying...' : 'Upload Backup File'}
            </label>
          </div>
       </div>
       <p className="text-xs text-gray-400 mt-4">
         Your private key never leaves your browser.
       </p>
    </div>
  )
}
