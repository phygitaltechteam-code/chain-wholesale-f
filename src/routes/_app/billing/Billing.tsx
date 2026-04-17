import Billing from '@/components/Billing/Billing';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/billing/Billing')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Billing />;
}
