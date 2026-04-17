import {createFileRoute} from '@tanstack/react-router';
import ClientDirectory from '@/components/Client/ClientDirectory';

export const Route = createFileRoute('/_app/client/clientdirectory')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ClientDirectory />;
}
