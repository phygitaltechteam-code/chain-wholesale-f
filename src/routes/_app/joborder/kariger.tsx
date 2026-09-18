import Kariger from '@/components/joborder/Kariger';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/joborder/kariger')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Kariger />;
}
