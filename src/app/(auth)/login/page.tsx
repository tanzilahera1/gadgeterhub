import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen py-20 px-4 flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background blobs for depth */}
      <div className="absolute top-1/4 left-1/4 size-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 size-96 bg-blue-500/5 rounded-full blur-[120px]" />
      
      <Suspense fallback={<div className="text-sm font-bold opacity-20">Loading...</div>}>
         <LoginForm />
      </Suspense>
    </main>
  );
}
