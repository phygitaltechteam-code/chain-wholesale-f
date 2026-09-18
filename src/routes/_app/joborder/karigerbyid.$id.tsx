import KarigarByid from '@/components/joborder/KarigarByid';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/joborder/karigerbyid/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  return <KarigarByid />;
}
