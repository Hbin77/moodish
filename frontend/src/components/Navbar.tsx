"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MenuIcon, XIcon } from "./Icons";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ghost-white border-b border-pale-sky">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-blue">
            <Image src="/logo.png" alt="Moodish" width={32} height={32} />
            Moodish
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-glaucous hover:text-slate-blue transition-colors">
              홈
            </Link>
            <Link href="/mood" className="text-glaucous hover:text-slate-blue transition-colors">
              레시피 받기
            </Link>
            <Link
              href="/mood"
              className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              시작하기
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden text-slate-blue"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴 열기"
          >
            {mobileOpen ? (
              <XIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-pale-sky bg-ghost-white">
          <div className="flex flex-col gap-2 px-4 py-4">
            <Link
              href="/"
              className="text-glaucous hover:text-slate-blue transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              홈
            </Link>
            <Link
              href="/mood"
              className="text-glaucous hover:text-slate-blue transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              레시피 받기
            </Link>
            <Link
              href="/mood"
              className="mt-2 rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white text-center hover:opacity-90 transition-opacity"
              onClick={() => setMobileOpen(false)}
            >
              시작하기
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
