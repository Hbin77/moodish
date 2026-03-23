export function cuisineBadgeColor(cuisine: string) {
  switch (cuisine) {
    case "한식":
      return "bg-[#FE5F55]/10 text-[#FE5F55]";
    case "중식":
      return "bg-red-100 text-red-600";
    case "양식":
      return "bg-blue-100 text-blue-600";
    case "일식":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-500";
  }
}
