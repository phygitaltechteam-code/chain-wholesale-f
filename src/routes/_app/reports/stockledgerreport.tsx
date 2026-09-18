import StockLedgerReport from '@/components/reports/StockLedgerReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/reports/stockledgerreport')({
  component: RouteComponent,
});

function RouteComponent() {
  return <StockLedgerReport />;
}
