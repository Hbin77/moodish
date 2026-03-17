"use client";

import { useState, useEffect } from "react";

const MESSAGES = [
  "AI 셰프가 기분을 분석하고 있어요...",
  "오늘 딱 맞는 레시피를 찾고 있어요...",
  "재료를 골라보고 있어요...",
  "맛있는 레시피를 준비 중이에요...",
  "거의 다 됐어요! 조금만 기다려주세요...",
];

export default function LoadingSpinner() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
      <p className="text-sm text-stone-500">{MESSAGES[msgIdx]}</p>
    </div>
  );
}
