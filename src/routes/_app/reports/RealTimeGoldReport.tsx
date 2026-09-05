import RealTimeGoldReport from '@/components/reports/RealTImeGoldReport'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/reports/realtimegoldreport')({
  component: RouteComponent,
})

function RouteComponent() {
  return <RealTimeGoldReport />
}
