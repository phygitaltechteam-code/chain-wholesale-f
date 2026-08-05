import  SolderingDept from '@/components/erp/manufacturingprocess/SolderingDept'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/manufacturingprocess/solding/soldingpage',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <SolderingDept />
}
