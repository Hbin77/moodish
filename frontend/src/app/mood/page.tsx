"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import MoodForm from "@/components/MoodForm";
import { useAuth } from "@/lib/auth-context";

export default function MoodPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-start justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-[#BDD5EA]/50 bg-white p-8 shadow-sm">
            <MoodForm />
          </div>
        </div>
      </main>
    </>
  );
}
