import JewellaryWork from '@/components/workorder/JewellaryWork';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/JewlleryWork/jewelleryworkdata')({
  component: RouteComponent,
});

function RouteComponent() {
  return <JewellaryWork />;
}
