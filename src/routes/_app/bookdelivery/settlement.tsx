import Settlement from '@/components/settlement/Settlement';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/bookdelivery/settlement')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Settlement />;
}
