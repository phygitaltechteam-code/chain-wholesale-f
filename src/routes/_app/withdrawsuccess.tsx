import WithdrawSuccess from '@/features/withdraw/WithdrawSuccess';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/withdrawsuccess')({
  component: WithdrawSuccess,
});
