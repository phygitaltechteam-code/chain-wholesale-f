import {useMemo} from 'react';
import {Job, ProcessStage} from './types';

export const useJobData = (rawJobData: any) => {
  return useMemo(() => {
    if (!rawJobData) {
      return {
        jobData: null,
        processStages: [],
        completedStages: [],
        inProgressStages: [],
      };
    }

    const raw = rawJobData?.data || rawJobData;

    const stages: ProcessStage[] = (raw.stages || raw.jobStages || []).map(
      (s: any) => {
        const karigarList = s.karigarDetails || (s.karigar ? [s.karigar] : []);
        const karigarIds =
          s.karigarIds ||
          (s.karigarId
            ? [s.karigarId]
            : karigarList.map((k: any) => k.id || k._id));

        return {
          id: s.id || s._id || '',
          stageId: s.id || s._id,
          jobId: s.jobId || raw.id,
          processId: s.processId || s.process?.id || '',
          processName: s.process?.name || s.processName || 'Process',
          process: s.process,
          karigarIds: karigarIds || [],
          karigarDetails: karigarList.map((k: any) => ({
            id: k.id || k._id,
            name: k.name || k.fullname || 'Karigar',
            stageId: s.id || s._id,
            fineGoldIssued: s.fineGoldIssued || 0,
            status: s.status,
          })),
          dateIssued: s.dateIssued || s.issueDate || s.createdAt || '',
          fineGoldIssued: Number(s.fineGoldIssued || s.goldIssued || 0),
          purity: Number(s.purity || raw.purity || 0),
          grossWeight: Number(s.grossWeight || s.grossWt || 0),
          labourType: (
            s.labourType ||
            s.labourChargeType ||
            'percentage'
          ).toLowerCase() as any,
          labourCharges: Number(s.labourCharges || 0),
          labourAmount: Number(s.labourAmount || 0),
          wastage: Number(s.wastage || 0),
          status: (s.status || 'IN_PROGRESS').toUpperCase() as any,
          jobStageCrystals: s.jobStageCrystals || s.crystals || [],
          returnDate: s.returnDate || null,
          goldReceived: Number(s.goldReceived || 0),
          returnWastage: Number(s.returnWastage || 0),
          scrap: Number(s.scrap || 0),
          createdAt: s.createdAt,
        };
      },
    );

    const completedStages = stages.filter((s) => s.status === 'COMPLETED');
    const inProgressStages = stages.filter((s) => s.status !== 'COMPLETED');

    const formattedJob: Job = {
      ...raw,
      id: raw.id || raw._id,
      stages,
    };

    return {
      jobData: formattedJob,
      processStages: stages,
      completedStages,
      inProgressStages,
    };
  }, [rawJobData]);
};
