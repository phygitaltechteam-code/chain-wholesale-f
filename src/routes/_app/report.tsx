import Report from '@/features/report/Report';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/report')({
  component: Report,
});
