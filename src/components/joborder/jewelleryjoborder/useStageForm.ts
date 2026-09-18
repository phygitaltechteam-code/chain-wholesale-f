import {useState} from 'react';
import toast from 'react-hot-toast';
import {ProcessStage, Process, StageCrystalItem} from './types';

interface UseStageFormProps {
  jobId: string;
  processes: Process[];
  karigars: any[];
  submitStage: any;
  updateJobStage: any;
  refetchJob: () => void;
  defaultPurity?: number;
}

export const useStageForm = ({
  jobId,
  submitStage,
  updateJobStage,
  refetchJob,
  defaultPurity = 91.6,
}: UseStageFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<ProcessStage | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedProcessId, setSelectedProcessId] = useState('');
  const [selectedKarigarIds, setSelectedKarigarIds] = useState<string[]>([]);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [fineGoldIssued, setFineGoldIssued] = useState<number>(0);
  const [purity, setPurity] = useState<number>(defaultPurity);
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [labourType, setLabourType] = useState<'percentage' | 'fixed'>('percentage');
  const [labourCharges, setLabourCharges] = useState<number>(0);
  const [wastage, setWastage] = useState<number>(0);
  const [stageCrystals, setStageCrystals] = useState<StageCrystalItem[]>([]);

  const resetForm = () => {
    setSelectedProcessId('');
    setSelectedKarigarIds([]);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setFineGoldIssued(0);
    setPurity(defaultPurity);
    setGrossWeight(0);
    setLabourType('percentage');
    setLabourCharges(0);
    setWastage(0);
    setStageCrystals([]);
    setEditingStage(null);
    setIsEditMode(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (stage: ProcessStage) => {
    setEditingStage(stage);
    setIsEditMode(true);
    setSelectedProcessId(stage.processId);
    setSelectedKarigarIds(stage.karigarIds.length ? stage.karigarIds : stage.karigarDetails.map((k) => k.id));
    setIssueDate(stage.dateIssued ? stage.dateIssued.split('T')[0] : new Date().toISOString().split('T')[0]);
    setFineGoldIssued(stage.fineGoldIssued);
    setPurity(stage.purity || defaultPurity);
    setGrossWeight(stage.grossWeight);
    setLabourType((stage.labourType || 'percentage').toLowerCase() as any);
    setLabourCharges(stage.labourCharges || 0);
    setWastage(stage.wastage || 0);

    if (stage.jobStageCrystals && stage.jobStageCrystals.length > 0) {
      setStageCrystals(
        stage.jobStageCrystals.map((c: any) => ({
          id: c.id || String(Date.now()),
          crystalId: c.crystalId || c.id,
          name: c.crystal?.name || c.name || 'Crystal',
          clarity: c.clarity,
          color: c.color,
          shape: c.shape,
          size: c.size,
          wt: c.wt,
          ct: c.ct,
          rate: c.rate,
          qty: c.qty || 1,
        }))
      );
    } else {
      setStageCrystals([]);
    }

    setIsOpen(true);
  };

  const handleKarigarToggle = (karigarId: string) => {
    if (selectedKarigarIds.includes(karigarId)) {
      setSelectedKarigarIds(selectedKarigarIds.filter((id) => id !== karigarId));
    } else {
      setSelectedKarigarIds([...selectedKarigarIds, karigarId]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProcessId) {
      toast.error('Please select a process');
      return;
    }
    if (selectedKarigarIds.length === 0) {
      toast.error('Please select at least one karigar');
      return;
    }
    if (!issueDate) {
      toast.error('Please select issue date');
      return;
    }
    if (!fineGoldIssued || fineGoldIssued <= 0) {
      toast.error('Please enter valid gold issued');
      return;
    }

    const labourAmount =
      labourType === 'percentage'
        ? Number(((fineGoldIssued * labourCharges) / 100).toFixed(2))
        : labourCharges;

    const crystalsForApi = stageCrystals.map((c) => ({
      crystalId: c.crystalId,
      qty: c.qty,
    }));

    setIsSubmitting(true);
    try {
      if (isEditMode && editingStage) {
        for (const karigarId of selectedKarigarIds) {
          await updateJobStage.mutateAsync({
            stageId: editingStage.stageId || editingStage.id,
            jobId,
            karigarId,
            processId: selectedProcessId,
            dateIssued: issueDate,
            fineGoldIssued,
            purity,
            grossWeight,
            labourChargeType: labourType.toUpperCase(),
            labourCharges,
            labourAmount,
            wastage,
            status: editingStage.status,
            jobStageCrystals: crystalsForApi,
          });
        }
        toast.success('Stage updated successfully');
      } else {
        for (const karigarId of selectedKarigarIds) {
          await submitStage.mutateAsync({
            jobId,
            karigarId,
            processId: selectedProcessId,
            dateIssued: issueDate,
            fineGoldIssued,
            purity,
            grossWeight,
            labourChargeType: labourType.toUpperCase(),
            labourCharges,
            labourAmount,
            wastage,
            status: 'IN_PROGRESS',
            jobStageCrystals: crystalsForApi,
          });
        }
        toast.success('Stage added successfully');
      }

      await refetchJob();
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Stage submit error:', error);
      toast.error(error?.response?.data?.message || 'Failed to save stage');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    isEditMode,
    editingStage,
    isSubmitting,
    selectedProcessId,
    setSelectedProcessId,
    selectedKarigarIds,
    setSelectedKarigarIds,
    handleKarigarToggle,
    issueDate,
    setIssueDate,
    fineGoldIssued,
    setFineGoldIssued,
    purity,
    setPurity,
    grossWeight,
    setGrossWeight,
    labourType,
    setLabourType,
    labourCharges,
    setLabourCharges,
    wastage,
    setWastage,
    stageCrystals,
    setStageCrystals,
    handleOpenAdd,
    handleOpenEdit,
    handleSubmit,
    resetForm,
  };
};
