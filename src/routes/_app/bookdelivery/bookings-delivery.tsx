import Bookingledger from '@/components/book_and_delivery/Bookingledger';
import BookingsAndDelivery from '@/components/book_and_delivery/BookingsAndDelivery';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/bookdelivery/bookings-delivery')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Bookingledger />;
}

export default RouteComponent;
