import JobCreation from '@/components/joborder/JobCreation';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/joborder/jobcreation')({
  component: RouteComponent,
});

function RouteComponent() {
  return <JobCreation />;
}
