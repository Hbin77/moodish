"use client";

interface MoodTextInputProps {
  value: string;
  onChange: (v: string) => void;
}

export default function MoodTextInput({ value, onChange }: MoodTextInputProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= 200) onChange(e.target.value);
        }}
        placeholder="오늘 기분을 자유롭게 적어주세요 (선택)"
        className="w-full resize-none rounded-2xl border-2 border-orange-100 bg-white p-4 text-stone-700 placeholder-stone-400 outline-none transition-colors focus:border-amber-400"
        rows={3}
      />
      <span className="absolute bottom-3 right-4 text-xs text-stone-400">
        {value.length}/200
      </span>
    </div>
  );
}
