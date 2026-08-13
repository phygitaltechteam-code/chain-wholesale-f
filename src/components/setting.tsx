import { useState } from "react"
import AdminProfile from "./AdminProfile"
import HeaderPdfDesign from "./HeaderPdfDesign"

export const Settings = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'header'>('profile')

    return (
        <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
            <div className="mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">

                {/* Simple Underline Tab Bar */}
                <div className="mb-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex gap-6">
                        {[
                            { id: 'profile', label: 'Admin Profile' },
                            { id: 'header', label: 'Bill Header' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'profile' | 'header')}
                                className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors duration-150 ${activeTab === tab.id
                                        ? 'border-[#785600] text-[#785600]'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'profile' && <AdminProfile />}
                    {activeTab === 'header' && <HeaderPdfDesign />}
                </div>

            </div>
        </div>
    )
}