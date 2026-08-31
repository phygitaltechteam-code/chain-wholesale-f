import CuttingDept from '@/components/erp/manufacturingprocess/cutting/CuttingDept';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_app/manufacturingprocess/cutting/cuttingdept',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <CuttingDept />;
}
