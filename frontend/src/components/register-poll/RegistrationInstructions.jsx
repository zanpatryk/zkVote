export default function RegistrationInstructions({ onRegister, isLoading, isRegistering, demo = false }) {
  return (
    <div className={`space-y-6 ${demo ? 'max-w-md mx-auto bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}`}>
      {demo && <h4 className="font-bold font-serif text-xl mb-4">Registration</h4>}
      
      <div className="bg-gray-50 p-6 rounded border border-gray-200">
        <h4 className="font-bold mb-2">How it works:</h4>
        <ul className="list-disc list-outside pl-5 text-gray-600 space-y-2">
          <li>We will ask you to sign a message to generate your secret identity.</li>
          <li>We generate a Zero-Knowledge Proof commitment.</li>
          <li>This commitment is added to the smart contract.</li>
          <li>When you vote, you prove you possess the secret without revealing it.</li>
        </ul>
      </div>

      <button
        onClick={demo ? () => {} : onRegister}
        disabled={(!demo && (isLoading || isRegistering))}
        className="w-full bg-black text-white py-4 rounded-lg text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-70"
      >
        {isLoading 
          ? 'Generating Identity...' 
          : isRegistering 
            ? 'Registering on Chain...' 
            : 'Create Identity & Register'
        }
      </button>
    </div>
  )
}
