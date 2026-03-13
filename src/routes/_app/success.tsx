import OrderSuccess from '@/features/market/OrderSuccess';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/success')({
  component: OrderSuccess,
});
