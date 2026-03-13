import MarketDetails from '@/features/market/MarketDetails';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/marketdetails')({
  component: MarketDetails,
});
