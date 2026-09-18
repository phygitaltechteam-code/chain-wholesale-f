import SupplierDirectory from '@/components/Supplier/SupplierDirectory';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/supplier/supplierdirectory')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SupplierDirectory />;
}
