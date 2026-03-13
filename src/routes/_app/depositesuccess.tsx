import DepositeSuccess from '@/features/deposite/DepositeSuccess';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/depositesuccess')({
  component: DepositeSuccess,
});
