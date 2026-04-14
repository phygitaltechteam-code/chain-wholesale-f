import Footer from '@/features/Footer';
import Market from '@/features/market/Market';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/dashboard')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#050a05]">
      {/* Main content - Market component */}
      <div className="flex-1 pb-20">
        <Market />
      </div>

      {/* Footer - with active market prop */}
      <Footer activeTab="market" />
    </div>
  );
}
