import Karigers from '@/components/kariger/Karigers';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/kariger/karigers')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Karigers />;
}
