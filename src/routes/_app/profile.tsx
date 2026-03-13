import Profile from '@/features/profile/Profile';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/profile')({
  component: Profile,
});
