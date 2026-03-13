import Market from '@/features/market/Market';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/market')({
  component: Market,
});
