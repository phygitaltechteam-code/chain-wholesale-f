import AdminProfile from '@/components/AdminProfile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/adminprofile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AdminProfile/>
}
