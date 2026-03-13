import Deposite from '@/features/deposite/Deposite'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/deposite')({
  component: Deposite,
})

