import OrderRejected from '@/features/market/OrderRejected'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/rejected')({
  component: OrderRejected,
})

