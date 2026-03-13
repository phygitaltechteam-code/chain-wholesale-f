import Withdraw from '@/features/withdraw/Withdraw';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/withdraw')({
  component: Withdraw,
});
