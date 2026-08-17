import AddTar from '@/components/erp/manufacturingprocess/AddTar';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/manufacturingprocess/AddTar')({
  component: RouteComponent,
});

function RouteComponent() {
  return <AddTar />;
}
