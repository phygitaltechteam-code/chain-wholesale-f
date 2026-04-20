import React from 'react';
import {Plus} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {useNavigate} from '@tanstack/react-router';
import DisplayBill from '@/components/Billing/DisplayBill';
import PageHeader from '@/components/Forms/Common/PageHeader';

const BillingMain = () => {
  const navigate = useNavigate();

  const handleAddBill = () => {
    navigate({to: '/billing/addbill'});
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      {/* Header with Add Bill Button - Now on same line */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageHeader
              title="Sales Bills"
              subtitle="View and manage all sales transactions"
            />
          </div>
          <GenericButton
            onClick={handleAddBill}
            className="flex items-center gap-2 !px-4 !py-2.5 shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add Bill
          </GenericButton>
        </div>
      </div>

      {/* DisplayBill Component - Removed its internal header */}
      <div className="px-4 pb-8 md:px-6 lg:px-8">
        <DisplayBill hideHeader={true} />
      </div>
    </div>
  );
};

export default BillingMain;
