"use client";

import { MOOD_OPTIONS } from "@/constants/moods";

interface MoodSelectorProps {
  selected: string | null;
  onSelect: (emoji: string) => void;
}

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {MOOD_OPTIONS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onSelect(mood.emoji)}
          className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-all hover:scale-105 ${
            selected === mood.emoji
              ? "border-amber-500 bg-amber-50 ring-2 ring-amber-300"
              : "border-orange-100 bg-white hover:border-amber-300"
          }`}
        >
          <span className="text-3xl">{mood.emoji}</span>
          <span className="text-xs text-stone-600">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}
