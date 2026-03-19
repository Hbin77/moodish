"use client";

import { RefObject, useState } from "react";
import html2canvas from "html2canvas";
import { Recipe } from "@/lib/types";

interface ShareButtonsProps {
  recipe: Recipe;
  cardRef: RefObject<HTMLDivElement | null>;
}

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

export default function ShareButtons({ recipe, cardRef }: ShareButtonsProps) {
  const [saving, setSaving] = useState(false);

  const handleKakaoShare = () => {
    if (!window.Kakao) {
      alert("카카오 SDK가 로드되지 않았습니다. 페이지를 새로고침 해주세요.");
      return;
    }

    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (key && !window.Kakao.isInitialized()) {
      window.Kakao.init(key);
    }

    window.Kakao.Share.sendDefault({
      objectType: "text",
      text: `[Moodish] ${recipe.recipe_name}\n\n${recipe.reaction}\n\n${recipe.description}`,
      link: {
        mobileWebUrl: window.location.origin,
        webUrl: window.location.origin,
      },
    });
  };

  const handleSaveImage = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#F7F7FF",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "moodish-recipe.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("이미지 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleKakaoShare}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#FEE500] py-3 text-sm font-semibold text-[#3C1E1E] transition-opacity hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 3C6.48 3 2 6.54 2 10.84c0 2.77 1.86 5.21 4.66 6.6l-1.2 4.42c-.1.38.32.68.65.47l5.27-3.46c.2.02.4.03.62.03 5.52 0 10-3.54 10-7.9S17.52 3 12 3z" />
        </svg>
        카카오톡 공유
      </button>
      <button
        onClick={handleSaveImage}
        disabled={saving}
        className="flex-1 rounded-full bg-[#495867] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#577399] disabled:opacity-60"
      >
        {saving ? "저장 중..." : "이미지 저장"}
      </button>
    </div>
  );
}
