import React from "react";
import {
  MdArrowBack,
  MdHelpOutline,
  MdFingerprint,
  MdCheckCircle,
  MdLock,
  MdAddAPhoto,
  MdFlipCameraIos,
  MdArrowForward,
} from "react-icons/md";

const Reg3: React.FC = ({setStep}: any) => {
  return (
    <div className="min-h-screen flex justify-center bg-[#000000]">
      <div className="w-full  min-h-screen flex flex-col bg-[#000000] text-white relative overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#000000]/95 backdrop-blur-sm">
          <button className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center hover:bg-[#1E1E1E]/80 transition-colors border border-white/5">
            <MdArrowBack className="text-white" />
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold tracking-tight text-white">
              Verify Identity
            </h1>
            <div className="flex gap-1 mt-1">
              <div className="w-2 h-1 rounded-full bg-[#39FF14]"></div>
              <div className="w-6 h-1 rounded-full bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.6)]"></div>
              <div className="w-2 h-1 rounded-full bg-white/20"></div>
            </div>
          </div>

          <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#39FF14] hover:text-[#39FF14]/80">
            <MdHelpOutline />
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 px-6 pb-28 pt-2 overflow-y-auto">
          <div className="mb-8 mt-2">
            <h2 className="text-2xl font-bold text-white mb-2">
              Aadhar Verification
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Please enter your 12-digit Aadhar number and upload photos to
              unlock higher trading limits.
            </p>
          </div>

          {/* Aadhar Input */}
          <div className="mb-8 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#39FF14] ml-1">
              Aadhar Number
            </label>

            <div className="relative">
              <input
                maxLength={14}
                placeholder="0000 0000 0000"
                className="w-full bg-[#1E1E1E] text-white pl-12 pr-4 py-4 rounded-xl border border-white/20 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none placeholder-white/30 text-lg tracking-wider font-medium"
              />

              <MdFingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />

              <MdCheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-[#39FF14] opacity-0" />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-500 px-2 mt-2">
              <MdLock className="text-sm" />
              <p>Your ID is encrypted with 256-bit SSL security.</p>
            </div>
          </div>

          {/* Upload Sections */}
          <div className="space-y-6">
            {/* Front */}
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-sm font-medium text-white/90">
                  Front of Aadhar Card
                </label>
                <span className="text-xs text-[#39FF14] bg-[#39FF14]/5 px-2 py-0.5 rounded border border-[#39FF14]/20">
                  Required
                </span>
              </div>

              <button className="w-full aspect-[1.58/1] rounded-xl border-2 border-dashed border-white/20 bg-[#1E1E1E]/50 flex flex-col items-center justify-center gap-3 active:scale-[0.98] cursor-pointer hover:border-[#39FF14]/50 relative overflow-hidden">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[#39FF14]/10 flex items-center justify-center mb-3 border border-[#39FF14]/20">
                    <MdAddAPhoto className="text-2xl text-[#39FF14]" />
                  </div>

                  <span className="text-sm font-medium text-white/80">
                    Tap to upload front side
                  </span>

                  <span className="text-xs text-gray-500 mt-1">
                    Supports JPG, PNG under 5MB
                  </span>
                </div>
              </button>
            </div>

            {/* Back */}
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-sm font-medium text-white/90">
                  Back of Aadhar Card
                </label>
                <span className="text-xs text-[#39FF14] bg-[#39FF14]/5 px-2 py-0.5 rounded border border-[#39FF14]/20">
                  Required
                </span>
              </div>

              <button className="w-full aspect-[1.58/1] rounded-xl border-2 border-dashed border-white/20 bg-[#1E1E1E]/50 flex flex-col items-center justify-center gap-3 active:scale-[0.98] cursor-pointer hover:border-[#39FF14]/50 relative overflow-hidden">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3 border border-white/5">
                    <MdFlipCameraIos className="text-2xl text-white/40" />
                  </div>

                  <span className="text-sm font-medium text-white/60">
                    Tap to upload back side
                  </span>
                </div>
              </button>
            </div>

            {/* Tips */}
            <div className="bg-[#1E1E1E]/50 rounded-xl p-4 border border-white/5 mt-6">
              <h4 className="text-xs font-semibold text-white/90 uppercase mb-3 tracking-wide">
                Tips for quick approval
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {[
                  "Good lighting",
                  "No flash glare",
                  "Corners visible",
                  "Text is readable",
                ].map((tip) => (
                  <div key={tip} className="flex items-start gap-2">
                    <MdCheckCircle className="text-[#39FF14] text-sm mt-0.5" />
                    <span className="text-xs text-gray-400">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Button */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#000000]/95 backdrop-blur-md border-t border-white/5 p-6">
          <button
            onClick={() => setStep(4)}
            className="w-full bg-[#39FF14] text-black font-bold py-4 rounded-xl text-lg shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_25px_rgba(57,255,20,0.4)] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>Verify & Continue</span>
            <MdArrowForward className="text-xl" />
          </button>
        </div>

        {/* Glow Background */}
        <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#39FF14]/5 via-[#39FF14]/0 to-transparent pointer-events-none opacity-50"></div>
      </div>
    </div>
  );
};

export default Reg3;