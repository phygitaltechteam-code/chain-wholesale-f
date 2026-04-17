import StockReport from '@/pages/reports/StockReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/reports/stock-report')({
  component: RouteComponent,
});

function RouteComponent() {
  return <StockReport />;
}
