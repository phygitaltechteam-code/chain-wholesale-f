import KarigarReport from '@/components/joborder/karigar/KarigarReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/karigar/karigarreport/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  return <KarigarReport />;
}
