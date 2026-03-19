import { MoodOption } from "@/lib/types";

export const MOOD_OPTIONS: MoodOption[] = [
  { icon: "face-smile", label: "행복해", value: "happy" },
  { icon: "face-frown", label: "슬퍼", value: "sad" },
  { icon: "fire", label: "화나", value: "angry" },
  { icon: "moon", label: "피곤해", value: "tired" },
  { icon: "heart", label: "설레", value: "excited" },
  { icon: "bolt", label: "불안해", value: "anxious" },
  { icon: "hand-raised", label: "위로받고 싶어", value: "comfort" },
  { icon: "sparkles", label: "축하할 일 있어", value: "celebration" },
  { icon: "beaker", label: "아파", value: "sick" },
  { icon: "minus-circle", label: "그냥 그래", value: "neutral" },
  { icon: "cloud", label: "우울해", value: "depressed" },
  { icon: "rocket", label: "의욕 넘쳐", value: "motivated" },
];
