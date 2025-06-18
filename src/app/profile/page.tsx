'use client';

import ProfileHeader from '../@/components/ProfileHeader';
import ProfileTabs from '../@/components/ProfileTabs';

export default function ProfilePage() {
  return (
    <main className="bg-[#0f0f0f] text-white min-h-screen p-8">
      <ProfileHeader />
      <ProfileTabs />
      
    </main>
  );
}
