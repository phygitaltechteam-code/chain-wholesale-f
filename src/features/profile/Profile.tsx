import {useRouter} from '@tanstack/react-router';
import React from 'react';
import {
  MdArrowBack,
  MdCameraAlt,
  MdEdit,
  MdPerson,
  MdPhoneIphone,
  MdVerified,
  MdChevronRight,
  MdDiversity1,
  MdAccountBalance,
  MdCheckCircle,
} from 'react-icons/md';

const Profile: React.FC = () => {
  const router = useRouter();
  return (
    <div className="flex justify-center bg-[#000000] text-white">
      <div className="relative flex w-full flex-col overflow-hidden border border-white/5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#000000] px-6 pb-4 pt-2">
          <button
            onClick={() => {
              router.history.back();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
          >
            <MdArrowBack className="text-white" />
          </button>

          <h1 className="text-lg font-semibold tracking-tight text-white">
            Edit Profile
          </h1>

          <div className="h-10 w-10" />
        </div>

        {/* Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          {/* Profile Photo */}
          <div className="relative mb-8 mt-2 flex flex-col items-center justify-center">
            <div className="group relative cursor-pointer">
              <div className="h-28 w-28 rounded-full border-2 border-[#37ec13] p-1 shadow-[0_0_20px_rgba(55,236,19,0.2)]">
                <div className="relative h-full w-full overflow-hidden rounded-full bg-[#000000]">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJUoDBgD_i1-S1kFp6x9JTuFEKouYQ0bIXgeX_imhWMMGDfJh0uCBWWGkynXT2WE-h7jPccF9AoITRTO4UahKBV6-g2IiMnSQENRKU6bQcEj1suQv327thSCcwvplRQQWPhT9KNr5kmHYhV3AopghepfYTeZtdmS4_8Tr_wYUM7tw74wGZcoTRj5d9G7WLSnoHelaGlcln1sjaMvIAQISFEHtZbx2AIhBqNQQgstGVuXpCBoM6_VCWqYxMfWdmPjcoFAA3vyPCUNo"
                    alt="Profile"
                    className="h-full w-full object-cover opacity-90"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-[#000000] opacity-0 transition-opacity group-hover:opacity-100">
                    <MdCameraAlt className="text-xl text-white" />
                  </div>
                </div>
              </div>

              <button className="absolute bottom-0 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-[#37ec13] text-black shadow-lg">
                <MdEdit className="text-sm" />
              </button>
            </div>

            <p className="mt-3 text-xs font-medium uppercase tracking-widest text-[#37ec13]/70">
              Change Photo
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                Legal Full Name
              </label>

              <div className="relative">
                <input
                  type="text"
                  defaultValue="Michael Thompson"
                  className="w-full rounded-full border border-white/10 bg-[#0a0a0a] py-4 pl-6 pr-12 text-sm font-medium text-white transition-all focus:border-[#37ec13]/50 focus:outline-none focus:ring-1 focus:ring-[#37ec13]/50"
                />

                <MdPerson className="absolute right-5 top-1/2 -translate-y-1/2 text-lg text-white/20" />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                Mobile Number
              </label>

              <div className="relative">
                <input
                  type="tel"
                  defaultValue="555-0123-456"
                  className="w-full rounded-full border border-white/10 bg-[#000000] py-4 pl-6 pr-12 text-sm font-medium text-white transition-all focus:border-[#37ec13]/50 focus:outline-none focus:ring-1 focus:ring-[#37ec13]/50"
                />

                <MdPhoneIphone className="absolute right-5 top-1/2 -translate-y-1/2 text-lg text-white/20" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                Email Address
              </label>

              <div className="relative">
                <input
                  type="email"
                  readOnly
                  value="michael.t@example.com"
                  className="w-full cursor-not-allowed rounded-full border border-white/5 bg-white/5 py-4 pl-6 pr-24 text-sm font-medium text-white/40"
                />

                <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-[#37ec13]/20 bg-[#37ec13]/10 px-2 py-1">
                  <MdVerified className="text-[10px] text-[#37ec13]" />
                  <span className="text-[9px] font-bold uppercase text-[#37ec13]">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* City + Zip */}
            <div className="flex w-full gap-3">
              <div className="w-1/2">
                <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                  City
                </label>

                <input
                  type="text"
                  defaultValue="New York"
                  className="w-full rounded-full border border-white/10 bg-[#000000] px-6 py-4 text-sm font-medium text-white focus:border-[#37ec13]/50 focus:outline-none"
                />
              </div>

              <div className="w-1/2">
                <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Zip Code
                </label>

                <input
                  type="text"
                  defaultValue="10001"
                  className="w-full rounded-full border border-white/10 bg-[#000000] px-6 py-4 text-sm font-medium text-white focus:border-[#37ec13]/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Account Details */}
            <div className="pt-4">
              <label className="mb-3 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                Account Details
              </label>

              <div className="space-y-3">
                <button className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-[#000000] px-6 py-4 text-white transition-all hover:border-[#37ec13]/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#37ec13]/10">
                      <MdDiversity1 className="text-[#37ec13]" />
                    </div>

                    <div className="text-left">
                      <h3 className="text-sm font-semibold">Nominee Details</h3>
                      <p className="text-[11px] text-white/40">
                        Manage inheritance beneficiaries
                      </p>
                    </div>
                  </div>

                  <MdChevronRight className="text-white/20 transition-colors group-hover:text-[#37ec13]" />
                </button>

                <button className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-[#000000] px-6 py-4 text-white transition-all hover:border-[#37ec13]/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#37ec13]/10">
                      <MdAccountBalance className="text-[#37ec13]" />
                    </div>

                    <div className="text-left">
                      <h3 className="text-sm font-semibold">Bank Details</h3>
                      <p className="text-[11px] text-white/40">
                        Update withdrawal account
                      </p>
                    </div>
                  </div>

                  <MdChevronRight className="text-white/20 transition-colors group-hover:text-[#37ec13]" />
                </button>
              </div>
            </div>
          </div>
          {/* Bottom Save Button */}
          <div className="w-full border-t border-white/5 bg-[#000000] p-6 backdrop-blur-lg">
            <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#37ec13] py-4 text-sm font-bold tracking-widest text-black shadow-[0_0_20px_rgba(55,236,19,0.3)] transition-all hover:bg-[#2dd40f] active:scale-[0.98]">
              <span>Save Changes</span>
              <MdCheckCircle className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
