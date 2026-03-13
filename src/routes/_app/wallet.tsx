import Wallet from '@/features/wallet/Wallet';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/wallet')({
  component: Wallet,
});
