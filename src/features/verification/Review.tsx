import React from "react";
import {
  MdHeadsetMic,
  MdPendingActions,
  MdBadge,
  MdFace,
  MdCheckCircle,
  MdDone,
  MdSync,
  MdArrowBack,
} from "react-icons/md";

const Review: React.FC = () => {
  return (
    <div className="min-h-screen flex justify-center bg-[#132210]">
      <div className="w-full max-w-[420px] min-h-screen flex flex-col bg-[#132210] text-white relative overflow-hidden">
        {/* Header */}
        <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-[#132210]/95 backdrop-blur-md">
          <div className="w-10"></div>

          <h1 className="text-lg font-semibold tracking-wide text-white">
            Status Check
          </h1>

          <button className="p-2 -mr-2 rounded-full hover:bg-slate-200 transition-colors">
            <MdHeadsetMic className="text-2xl text-white" />
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-6 pb-32 flex flex-col items-center text-center pt-8">
          {/* Icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#FFD700]/20 rounded-full blur-2xl animate-pulse"></div>

            <div className="w-32 h-32 rounded-full bg-gradient-to-b from-[#253f1f] to-[#1a2e16] border border-[#FFD700]/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(255,215,0,0.1)]">
              <MdPendingActions className="text-6xl text-[#FFD700]" />

              <div className="absolute -bottom-2 bg-[#1a2e16] border border-[#FFD700]/50 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse"></div>
                <span className="text-[10px] font-bold text-[#FFD700] uppercase tracking-wider">
                  Reviewing
                </span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white mb-3">
            Application Under Review
          </h2>

          <p className="text-white leading-relaxed max-w-xs mx-auto mb-8">
            Thanks for submitting your documents. Our team is verifying your
            identity. This usually takes less than{" "}
            <span className="text-[#37ec13] font-semibold">24 hours</span>.
          </p>

          {/* Submitted Docs */}
          <div className="w-full bg-[#1a2e16] rounded-2xl p-5 shadow-sm text-left">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Submitted Documents
            </h3>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#37ec13]">
                <MdBadge className="text-lg" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Aadhar Card
                </p>
                <p className="text-xs text-white">ID: ••••••4567</p>
              </div>

              <MdCheckCircle className="text-[#FFD700] text-xl" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#37ec13]">
                <MdFace className="text-lg" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Selfie Verification
                </p>
                <p className="text-xs text-white">Uploaded 10 mins ago</p>
              </div>

              <MdCheckCircle className="text-[#FFD700] text-xl" />
            </div>
          </div>

          {/* Timeline */}
          <div className="w-full mt-8 px-2">
            {/* Step 1 */}
            <div className="flex items-start gap-4 relative">
              <div className="absolute left-[19px] top-2 bottom-0 w-[2px] bg-[#253f1f] -z-10"></div>

              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-[#37ec13] flex items-center justify-center shadow-[0_0_10px_rgba(55,236,19,0.3)]">
                  <MdDone className="text-[#132210] text-lg" />
                </div>
              </div>

              <div className="flex-1 text-left pt-2 pb-6">
                <h4 className="text-sm font-bold text-[#37ec13]">
                  Submission Received
                </h4>
                <p className="text-xs text-white mt-0.5">
                  We have received your application.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 relative">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-[#253f1f] border-2 border-[#FFD700] flex items-center justify-center shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                  <MdSync className="text-[#FFD700] text-lg animate-spin" />
                </div>
              </div>

              <div className="flex-1 text-left pt-2">
                <h4 className="text-sm font-bold text-[#FFD700]">
                  Under Review
                </h4>
                <p className="text-xs text-white mt-0.5">
                  Our compliance team is checking your details.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#1a2e16] via-[#1a2e16] to-transparent pt-12">
          <button className="w-full bg-[#253f1f] border border-[#37ec13]/20 hover:border-[#37ec13]/50 text-white font-bold text-lg py-4 rounded-full active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
            <MdArrowBack className="text-[#37ec13] group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

         
        </div>
      </div>
    </div>
  );
};

export default Review;