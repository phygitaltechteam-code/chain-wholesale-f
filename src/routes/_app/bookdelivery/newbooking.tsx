import RegisterNewTrade from '@/components/book_and_delivery/BookingsAndDelivery';
import BookingsAndDelivery from '@/components/book_and_delivery/BookingsAndDelivery';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/bookdelivery/newbooking')({
  component: RouteComponent,
});

function RouteComponent() {
  return <RegisterNewTrade />;
}
