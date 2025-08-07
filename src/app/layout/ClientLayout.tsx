'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from './NavBar';
import BottomBar from './BottomBar';
import OnboardingModal from '../@/components/OnboardingModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';
  const isAdminPage = pathname.startsWith('/admin');

  const shouldHideBars = isAuthPage || isAdminPage;

  return (
    <>
      {!shouldHideBars && <NavBar />}
      <main className="flex-1">{children}</main>
      {!shouldHideBars && <BottomBar />}
      {/* <OnboardingModal /> */}
    </>
  );
}
