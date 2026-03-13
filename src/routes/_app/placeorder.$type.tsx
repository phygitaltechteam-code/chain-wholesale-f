import Buy from '@/features/market/Buy';
import Sell from '@/features/market/Sell';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/placeorder/$type')({
  component: () => Functionality(),
});

function Functionality() {
  const {type} = Route.useParams();

  const Component = type === 'buy' ? Buy : type === 'sell' ? Sell : null;

  return Component ? <Component /> : <div>Invalid order type</div>;
}
