import {createLazyFileRoute} from '@tanstack/react-router';

import SignIn from '@/features/auth/SignIn';

export const Route = createLazyFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SignIn />;
}
