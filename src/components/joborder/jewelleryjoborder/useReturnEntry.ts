import {useState} from 'react';
import toast from 'react-hot-toast';
import {ProcessStage} from './types';

interface UseReturnEntryProps {
  jobId: string;
  submitReturnEntry: any;
  refetchJob: () => void;
}

export const useReturnEntry = ({
  jobId,
  submitReturnEntry,
  refetchJob,
}: UseReturnEntryProps) => {
  const [selectedStage, setSelectedStage] = useState<ProcessStage | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [goldReceived, setGoldReceived] = useState<number>(0);
  const [returnWastage, setReturnWastage] = useState<number>(0);
  const [scrap, setScrap] = useState<number>(0);

  const handleOpenReturn = (stage: ProcessStage) => {
    setSelectedStage(stage);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setGoldReceived(stage.fineGoldIssued || 0);
    setReturnWastage(stage.wastage || 0);
    setScrap(0);
    setIsOpen(true);
  };

  const handleCloseReturn = () => {
    setSelectedStage(null);
    setIsOpen(false);
    setIsSubmitting(false);
  };

  const handleSubmitReturn = async () => {
    if (!selectedStage) return;
    if (!returnDate) {
      toast.error('Please select return date');
      return;
    }
    if (goldReceived < 0) {
      toast.error('Gold received cannot be negative');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReturnEntry.mutateAsync({
        stageId: selectedStage.stageId || selectedStage.id,
        jobId,
        returnDate,
        goldReceived,
        returnWastage,
        scrap,
        status: 'COMPLETED',
      });

      await refetchJob();
      handleCloseReturn();
    } catch (error: any) {
      console.error('Return submit error:', error);
      toast.error(error?.response?.data?.message || 'Failed to record return entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedStage,
    isOpen,
    isSubmitting,
    returnDate,
    setReturnDate,
    goldReceived,
    setGoldReceived,
    returnWastage,
    setReturnWastage,
    scrap,
    setScrap,
    handleOpenReturn,
    handleCloseReturn,
    handleSubmitReturn,
  };
};
