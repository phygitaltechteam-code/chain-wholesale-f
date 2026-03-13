import OrderManagement from '@/features/order/OrderManagement'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/order')({
  component: OrderManagement,
})
