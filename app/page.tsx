'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { BottomCarousel } from '@/components/restaurant/BottomCarousel';
import { RestaurantPopup } from '@/components/restaurant/RestaurantPopup';

// The map is heavy and touches `window`, so load it on the client only.
const MapView = dynamic(() => import('@/components/map/MapView').then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  ),
});

export default function Page() {
  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-background">
      <MapView />
      <TopBar />
      <Sidebar />
      <BottomCarousel />
      <RestaurantPopup />
    </main>
  );
}
