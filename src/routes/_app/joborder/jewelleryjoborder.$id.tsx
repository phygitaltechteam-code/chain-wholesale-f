import {createFileRoute} from '@tanstack/react-router';
import JewelleryJobOrder from '@/components/joborder/jewelleryjoborder/JewelleryJobOrder';

export const Route = createFileRoute('/_app/joborder/jewelleryjoborder/$id')({
  component: JewelleryJobOrder,
});
