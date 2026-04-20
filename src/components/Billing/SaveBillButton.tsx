// components/Billing/components/SaveBillButton.tsx
import React from 'react';
import {MdSave} from 'react-icons/md';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

interface SaveBillButtonProps {
  onSave: () => void;
  isSubmitting: boolean;
}

export const SaveBillButton: React.FC<SaveBillButtonProps> = ({
  onSave,
  isSubmitting,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d3c4af]/20 bg-white px-4 py-3 shadow-lg md:relative md:mt-4 md:px-8 md:py-6">
      <div className="flex justify-center md:justify-end">
        <GenericButton
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          className="metallic-gradient w-full !px-4 !py-3 shadow-lg shadow-[#785600]/30 transition-transform hover:scale-105 md:w-auto md:!px-8 md:!py-4"
        >
          {isSubmitting ? 'Saving...' : 'Save Bill'}
        </GenericButton>
      </div>
    </div>
  );
};
