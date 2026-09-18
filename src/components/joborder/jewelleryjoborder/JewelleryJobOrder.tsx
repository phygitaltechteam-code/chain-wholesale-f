import React, {useState} from 'react';
import {useNavigate} from '@tanstack/react-router';
import {Route} from '@/routes/_app/joborder/jewelleryjoborder.$id';
import {usePermission} from '@/hooks/usePermission';
import {useGetJobById, useSubmitJobKarigar, useUpdateJobStage, useSubmitReturnEntry, useEditJob} from './jewelleryjoborderapi';
import {useGetProcesses} from '../processapi';
import {useGetKarigars} from '../karigarapi';
import {useJobData} from './useJobData';
import {useStageForm} from './useStageForm';
import {useReturnEntry} from './useReturnEntry';
import JobHeader from './JobHeader';
import OrderFoundation from './OrderFoundation';
import ProcessOrchestration from './ProcessOrchestration';
import AddStageModal from './AddStageModal';
import ReturnEntryModal from './ReturnEntryModal';
import ImageModal from './ImageModal';
import {AddJobModal} from '../jobcreation/AddJobModal';
import {useGetClients} from '@/lib/api/client';
import AddClientModal from '@/components/Client/AddClientModal';

export const JewelleryJobOrder: React.FC = () => {
  const navigate = useNavigate();
  const {id} = Route.useParams();

  const {canEdit: canEditKarigar} = usePermission('karigar');
  const {canEdit: canEditJob} = usePermission('jobCreation');
  const canEdit = canEditKarigar || canEditJob;

  // Query hooks
  const {data: jobByIdData, isLoading: isLoadingJob, refetch: refetchJob} = useGetJobById(id || '');
  const {data: processesData} = useGetProcesses();
  const {data: karigarsData} = useGetKarigars();
  const {data: clientsData, isLoading: clientsLoading, refetch: refetchClients} = useGetClients();

  const processes = processesData || [];
  const karigars = Array.isArray(karigarsData?.data || karigarsData) ? karigarsData?.data || karigarsData : [];
  const clients = Array.isArray(clientsData) ? clientsData : [];

  // Mutations
  const submitStage = useSubmitJobKarigar();
  const updateJobStage = useUpdateJobStage();
  const submitReturnEntry = useSubmitReturnEntry();

  // Custom data hook
  const {jobData, processStages, completedStages, inProgressStages} = useJobData(jobByIdData);

  // Stage form hook
  const stageForm = useStageForm({
    jobId: id || '',
    processes,
    karigars,
    submitStage,
    updateJobStage,
    refetchJob,
    defaultPurity: jobData?.purity || 91.6,
  });

  // Return entry hook
  const returnForm = useReturnEntry({
    jobId: id || '',
    submitReturnEntry,
    refetchJob,
  });

  // Image zoom modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Edit Job Modal state
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  const handleBack = () => {
    navigate({to: '/joborder/jobcreation'});
  };

  if (isLoadingJob) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#785600] border-t-transparent"></div>
          <p className="mt-3 text-xs font-semibold text-[#4f4535] dark:text-slate-400">Loading manufacturing order...</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] p-6 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-sm font-bold text-[#4f4535] dark:text-slate-300">Job Order Not Found</p>
          <button
            onClick={handleBack}
            className="mt-4 rounded-xl bg-[#785600] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#986d00]"
          >
            Back to Job Creation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Top Header */}
      <JobHeader
        job={jobData}
        onBackClick={handleBack}
        onEditJob={() => setShowEditJobModal(true)}
        canEdit={canEdit}
      />

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Order Specifications & Material Foundation */}
        <OrderFoundation
          jobData={jobData}
          onEdit={() => setShowEditJobModal(true)}
          onImageClick={(img) => setSelectedImage(img)}
          canEditJob={canEdit}
        />

        {/* Manufacturing Process Stages */}
        <ProcessOrchestration
          processStages={processStages}
          completedStages={completedStages}
          inProgressStages={inProgressStages}
          onOpenAddStage={stageForm.handleOpenAdd}
          onEditStage={stageForm.handleOpenEdit}
          onReturnStage={returnForm.handleOpenReturn}
          canEdit={canEdit}
        />
      </div>

      {/* Add / Edit Stage Modal */}
      <AddStageModal
        isOpen={stageForm.isOpen}
        onClose={() => stageForm.setIsOpen(false)}
        isEditMode={stageForm.isEditMode}
        editingStage={stageForm.editingStage}
        processes={processes}
        karigars={karigars}
        selectedProcessId={stageForm.selectedProcessId}
        setSelectedProcessId={stageForm.setSelectedProcessId}
        selectedKarigarIds={stageForm.selectedKarigarIds}
        onKarigarToggle={stageForm.handleKarigarToggle}
        issueDate={stageForm.issueDate}
        setIssueDate={stageForm.setIssueDate}
        fineGoldIssued={stageForm.fineGoldIssued}
        setFineGoldIssued={stageForm.setFineGoldIssued}
        purity={stageForm.purity}
        setPurity={stageForm.setPurity}
        grossWeight={stageForm.grossWeight}
        setGrossWeight={stageForm.setGrossWeight}
        labourType={stageForm.labourType}
        setLabourType={stageForm.setLabourType}
        labourCharges={stageForm.labourCharges}
        setLabourCharges={stageForm.setLabourCharges}
        wastage={stageForm.wastage}
        setWastage={stageForm.setWastage}
        stageCrystals={stageForm.stageCrystals}
        setStageCrystals={stageForm.setStageCrystals}
        onSubmit={stageForm.handleSubmit}
        isSubmitting={stageForm.isSubmitting}
      />

      {/* Return Entry Modal */}
      <ReturnEntryModal
        isOpen={returnForm.isOpen}
        onClose={returnForm.handleCloseReturn}
        stage={returnForm.selectedStage}
        returnDate={returnForm.returnDate}
        setReturnDate={returnForm.setReturnDate}
        goldReceived={returnForm.goldReceived}
        setGoldReceived={returnForm.setGoldReceived}
        returnWastage={returnForm.returnWastage}
        setReturnWastage={returnForm.setReturnWastage}
        scrap={returnForm.scrap}
        setScrap={returnForm.setScrap}
        onSubmit={returnForm.handleSubmitReturn}
        isSubmitting={returnForm.isSubmitting}
      />

      {/* Image Preview Modal */}
      <ImageModal
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      {/* Edit Job Modal */}
      <AddJobModal
        isOpen={showEditJobModal}
        onClose={() => setShowEditJobModal(false)}
        onSuccess={() => {
          refetchJob();
          setShowEditJobModal(false);
        }}
        clients={clients}
        clientsLoading={clientsLoading}
        onAddNewClient={() => setShowAddClientModal(true)}
      />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onSuccess={() => refetchClients()}
      />
    </div>
  );
};

export default JewelleryJobOrder;
