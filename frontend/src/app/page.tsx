import MoodForm from "@/components/MoodForm";

export default function Home() {
  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-12">
      <main className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-bold text-stone-800">
            오늘 기분, 어떤 맛?
          </h1>
          <p className="text-stone-500">
            기분에 맞는 AI 레시피를 받아보세요
          </p>
        </div>
        <MoodForm />
      </main>
    </div>
  );
}
