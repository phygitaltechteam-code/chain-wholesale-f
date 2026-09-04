import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/reports/RealTimeGoldReport')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/reports/RealTimeGoldReport"!</div>
}
