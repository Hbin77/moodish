import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-blue text-ghost-white py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between md:items-start">
          <div>
            <p className="text-lg font-bold">Moodish</p>
            <p className="mt-1 text-sm text-pale-sky">오늘 기분, 어떤 맛?</p>
          </div>

          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-pale-sky hover:text-ghost-white transition-colors">
              홈
            </Link>
            <Link href="/mood" className="text-pale-sky hover:text-ghost-white transition-colors">
              레시피 받기
            </Link>
            <Link href="/recipes" className="text-pale-sky hover:text-ghost-white transition-colors">
              레시피 북
            </Link>
          </div>

          <p className="text-sm text-pale-sky">&copy; 2026 Moodish</p>
        </div>
      </div>
    </footer>
  );
}
