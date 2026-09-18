import KarigarReceiptAdd from '@/components/reciept/KarigarReceiptAdd';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/karigarbillingadd')({
  component: RouteComponent,
});

function RouteComponent() {
  return <KarigarReceiptAdd />;
}
