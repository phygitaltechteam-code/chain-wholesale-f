import ClientProfile from '@/components/Client/ClientProfile';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/client/clientdetails')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ClientProfile />;
}
