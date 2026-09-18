import KarigarBilling from '@/components/erp/KarigarBilling';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/karigarbilling')({
  component: RouteComponent,
});

function RouteComponent() {
  return <KarigarBilling />;
}
