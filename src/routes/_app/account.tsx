import Account from '@/components/account/Account';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/account')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Account />;
}
