import Inventory from '@/components/inventory/Inventory';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/inventory/Inventory')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Inventory />;
}
