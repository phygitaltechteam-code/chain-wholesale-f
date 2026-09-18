import Process from '@/components/joborder/Process';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/joborder/Process')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Process />;
}
