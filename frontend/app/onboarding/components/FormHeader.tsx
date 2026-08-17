import React from 'react';

interface FormHeaderProps {
  step: number;
}

export default function FormHeader({ step }: FormHeaderProps) {
  return (
    <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
      <div className="space-y-3 z-10">
        <span className="inline-block text-[9px] font-extrabold tracking-widest text-[#4f46e5] bg-[#e0e7ff] px-2.5 py-1 rounded-md uppercase font-mono">
          Step {step} of 6
        </span>
        
        {step === 1 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Welcome to Tendagon! 👋</h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              We're excited to have you on board. This onboarding process will help us know you better.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Your Information 👤</h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Please enter your contact details, professional position, and experience details.
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight font-sans">Financial Information</h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Please provide your payment and bank details.
            </p>
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Identity Verification 🛡️</h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Upload your national identification papers to clear legal compliance gates.
            </p>
          </>
        )}
        {step === 5 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">NDA & Signature ✍️</h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Acknowledge NDA agreements, and draw your legal digital signature.
            </p>
          </>
        )}
        {step === 6 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Review Submission 🎉</h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Double-check all entered records before sending the profile to administrators.
            </p>
          </>
        )}
      </div>

      {/* Decorative Studio Illustration / Financial Illustration */}
      <div className="shrink-0 select-none hidden sm:block">
        {step === 3 ? (
          <svg className="w-40 h-24 text-indigo-600" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bank Building */}
            <rect x="110" y="48" width="36" height="3" fill="#3b82f6" rx="1.5" />
            <rect x="114" y="32" width="28" height="3" fill="#3b82f6" rx="1" />
            {/* Roof Triangle */}
            <path d="M110 32 L128 18 L146 32 Z" fill="#2563eb" />
            {/* Columns */}
            <rect x="116" y="35" width="3" height="13" fill="#60a5fa" />
            <rect x="122" y="35" width="3" height="13" fill="#60a5fa" />
            <rect x="128" y="35" width="3" height="13" fill="#60a5fa" />
            <rect x="134" y="35" width="3" height="13" fill="#60a5fa" />
            <rect x="140" y="35" width="3" height="13" fill="#60a5fa" />
            
            {/* Wallet */}
            <rect x="25" y="38" width="66" height="44" rx="12" fill="#6366f1" />
            <path d="M25 49 L91 49 L91 70 C91 76.6 85.6 82 79 82 L37 82 C30.4 82 25 76.6 25 70 Z" fill="#4f46e5" />
            {/* Wallet strap */}
            <rect x="70" y="49" width="22" height="14" rx="4" fill="#818cf8" />
            <circle cx="77" cy="56" r="3" fill="#ffffff" />
            
            {/* Credit Card sticking out */}
            <rect x="35" y="24" width="42" height="26" rx="6" fill="#a5b4fc" transform="rotate(-12 35 24)" />
            <rect x="39" y="28" width="9" height="5" fill="#4f46e5" transform="rotate(-12 39 28)" />
            
            {/* Gold Coins */}
            <circle cx="18" cy="80" r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="18" cy="80" r="6" fill="#f59e0b" />
            <circle cx="32" cy="82" r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="32" cy="82" r="6" fill="#f59e0b" />
            
            {/* Sparks */}
            <path d="M135 12 L137 16 L141 17 L137 18 L135 22 L133 18 L129 17 L133 16 Z" fill="#a5b4fc" opacity="0.7" />
            <path d="M12 30 L14 33 L17 34 L14 35 L12 38 L10 35 L7 34 L10 33 Z" fill="#a5b4fc" opacity="0.7" />
          </svg>
        ) : (
          <svg className="w-48 h-32 text-indigo-600" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Spotlight Stand */}
            <path d="M190 120 L175 150 M190 120 L205 150 M190 50 L190 125" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
            {/* Spotlight Lamp */}
            <path d="M180 40 L200 45 L195 65 L175 60 Z" fill="#1e293b" stroke="currentColor" strokeWidth="2"/>
            <circle cx="187.5" cy="52.5" r="8" fill="#f59e0b"/>
            {/* Light Ray */}
            <polygon points="187.5,52.5 130,120 70,80" fill="url(#yellow-glow)" opacity="0.15"/>
            
            {/* Megaphone */}
            <path d="M140 100 L115 110 L105 95 L125 90 Z" fill="#6366f1"/>
            <path d="M125 90 C125 90 135 70 145 75 C155 80 140 100 140 100 Z" fill="#818cf8"/>
            <path d="M105 95 L95 102 L98 108 L108 101 Z" fill="#334155"/>
            <circle cx="142.5" cy="87.5" r="4" fill="#a5b4fc"/>

            {/* Director Chair */}
            <path d="M130 90 L160 145 M160 90 L130 145" stroke="#b45309" strokeWidth="3" strokeLinecap="round"/>
            <path d="M125 90 L165 90" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"/>
            <path d="M132 90 L132 60 M158 90 L158 60" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="128" y="65" width="34" height="15" rx="2" fill="#1e293b"/>
            <text x="145" y="74" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">DIRECTOR</text>

            {/* Gradient Glow */}
            <defs>
              <radialGradient id="yellow-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="1"/>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
              </radialGradient>
            </defs>
          </svg>
        )}
      </div>
    </div>
  );
}
