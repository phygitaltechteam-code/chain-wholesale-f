import Billing from '@/components/Billing/Billing';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/billing/addbill')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Billing />;
}
