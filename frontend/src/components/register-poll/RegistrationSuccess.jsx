export default function RegistrationSuccess({ 
  pollId, 
  registeredIdentity, 
  isJustRegistered, 
  onDownload 
}) {
  return (
    <div className="text-center py-8">
      <div className="text-black text-5xl mb-4">✓</div>
      <h3 className="text-2xl font-bold mb-2">
        {isJustRegistered ? 'Registration Successful!' : 'You are registered!'}
      </h3>
      
      {isJustRegistered ? (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Your ZK Identity is now registered.<br/>
          <span className="text-sm">You can use this identity commitment with any wallet address to cast your vote.</span>
        </p>
      ) : (
        <p className="text-gray-600 mb-8">You can now cast your anonymous vote.</p>
      )}

      <div className="flex flex-col gap-4 w-full">
        
        {isJustRegistered && onDownload && registeredIdentity && (
          <button 
            onClick={() => onDownload(registeredIdentity, pollId)}
            className="bg-black border-2 border-black text-white px-8 py-4 rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all w-full flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 10.5L12 15m0 0l4.5-4.5M12 15V3" />
            </svg>
            Download Identity
          </button>
        )}
      </div>
    </div>
  )
}
