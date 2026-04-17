import RateManagement from '@/components/rate/RateManagement';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/rate/ratemanagement')({
  component: RouteComponent,
});

function RouteComponent() {
  return <RateManagement />;
}
