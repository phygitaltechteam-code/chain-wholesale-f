import KarigarBillEdit from '@/components/erp/KarigarBillEdit';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/karigarbilliupdate/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  return <KarigarBillEdit />;
}
