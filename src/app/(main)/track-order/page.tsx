// src/app/(main)/track-order/page.tsx
import { Suspense } from "react";
import { TrackOrderForm } from "@/components/order/TrackOrderForm";

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen py-20 px-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-100">
            <p className="text-slate-500 font-medium animate-pulse">Loading...</p>
          </div>
        }
      >
        <TrackOrderForm />
      </Suspense>
    </main>
  );
}