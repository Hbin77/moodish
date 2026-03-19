"use client";

import { MOOD_OPTIONS } from "@/constants/moods";
import { MoodIcon } from "@/components/Icons";

interface MoodSelectorProps {
  selected: string | null;
  onSelect: (value: string) => void;
}

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
      {MOOD_OPTIONS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onSelect(mood.value)}
          className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-all hover:scale-105 hover:border-[#FE5F55] ${
            selected === mood.value
              ? "border-2 border-[#FE5F55] bg-[#FE5F55]/5"
              : "border border-[#BDD5EA] bg-white"
          }`}
        >
          <MoodIcon icon={mood.icon} className="h-6 w-6" />
          <span className="text-sm text-[#495867]">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}
