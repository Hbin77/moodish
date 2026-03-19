import Navbar from "@/components/Navbar";
import MoodForm from "@/components/MoodForm";

export default function MoodPage() {
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
