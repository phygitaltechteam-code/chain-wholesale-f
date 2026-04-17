import Report from '@/components/report/Report';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/report')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Report />;
}
