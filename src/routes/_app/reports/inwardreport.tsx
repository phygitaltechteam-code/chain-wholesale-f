import InwardReport from '@/components/erp/reports/InwardReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/reports/inwardreport')({
  component: RouteComponent,
});

function RouteComponent() {
  return <InwardReport />;
}
