export default function RegistrationInstructions({ onRegister, isLoading, isRegistering, demo = false }) {
  return (
    <div className={`text-center space-y-6 ${demo ? 'max-w-md mx-auto bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}`}>
      {demo && <h4 className="font-bold font-serif text-xl mb-4">Registration</h4>}
      
      {!demo && (
        <>
           <h2 className="text-2xl font-bold font-serif">Create ZK Identity</h2>
           <p className="text-gray-600">
             To participate anonymously, you need to generate a secure Zero-Knowledge identity using your wallet.
           </p>
        </>
      )}

      {/* Simplified Steps */}
      <div className="flex justify-center items-center gap-1 text-xs text-gray-500 mb-6">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Sign Message
        </span>
        <span>→</span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Generate Proof
        </span>
        <span>→</span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Register on Chain
        </span>
      </div>

      <button
        onClick={demo ? () => {} : onRegister}
        disabled={(!demo && (isLoading || isRegistering))}
        className="inline-flex items-center justify-center gap-2 w-full bg-black text-white py-4 rounded-lg text-lg md:text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-70"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
           <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
        {isLoading 
          ? 'Generating Identity...' 
          : isRegistering 
            ? 'Registering on Chain...' 
            : 'Register & Create Identity'
        }
      </button>
      
      <p className="text-xs text-gray-400 mt-4">
         Your private key never leaves your browser.
      </p>
    </div>
  )
}
