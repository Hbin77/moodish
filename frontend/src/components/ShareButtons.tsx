"use client";

import { RefObject } from "react";
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
  const handleKakaoShare = () => {
    if (!window.Kakao) return;

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: recipe.recipe_name,
        description: recipe.description,
        imageUrl: "",
        link: {
          mobileWebUrl: window.location.origin,
          webUrl: window.location.origin,
        },
      },
      buttons: [
        {
          title: "나도 레시피 받기",
          link: {
            mobileWebUrl: window.location.origin,
            webUrl: window.location.origin,
          },
        },
      ],
    });
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#FFFBF5",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "moodish-recipe.png";
      link.href = canvas.toDataURL();
      link.click();
    } catch {
      alert("이미지 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleKakaoShare}
        className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-semibold text-yellow-900 transition-colors hover:bg-yellow-500"
      >
        카카오톡 공유
      </button>
      <button
        onClick={handleSaveImage}
        className="flex-1 rounded-2xl bg-stone-200 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-300"
      >
        이미지 저장
      </button>
    </div>
  );
}
