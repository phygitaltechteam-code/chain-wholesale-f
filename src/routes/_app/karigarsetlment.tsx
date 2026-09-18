import KarigarSettlement from '@/components/setllement/KarigarSettlement';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/karigarsetlment')({
  component: RouteComponent,
});

function RouteComponent() {
  return <KarigarSettlement />;
}
