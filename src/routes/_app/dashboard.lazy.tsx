import Dashboard from '@/components/dashboard/Dashboard';
import {createLazyFileRoute} from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_app/dashboard')({
  // component: Dashboard,
   component: () => <>dashboard</>,
});
