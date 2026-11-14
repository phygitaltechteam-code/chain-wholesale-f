import {createLazyFileRoute, Navigate} from '@tanstack/react-router';
// import LandingPage from '@/components/landing/LandingPage';

export const Route = createLazyFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  // Redirect the app root straight to the Sign In page
  return <Navigate to="/signin" replace />;
  // return <LandingPage />;
}
