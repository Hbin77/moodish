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
        className="w-full resize-none rounded-xl border border-[#BDD5EA] bg-white p-4 text-[#495867] placeholder:text-[#577399]/50 outline-none transition-colors focus:border-[#FE5F55] focus:ring-2 focus:ring-[#FE5F55]/20"
        rows={3}
      />
      <span className="absolute bottom-3 right-4 text-xs text-[#577399]">
        {value.length}/200
      </span>
    </div>
  );
}
