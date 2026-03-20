"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/auth-api";
import { DIETARY_OPTIONS } from "@/constants/dietary";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAge(user.age != null ? String(user.age) : "");
      setGender(user.gender || "");
      setDietary(user.dietary ? user.dietary.split(",") : []);
    }
  }, [user]);

  if (loading || !user || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7FF]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BDD5EA] border-t-[#FE5F55]" />
      </main>
    );
  }

  const handleDietaryToggle = (item: string) => {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateProfile(token, {
        name,
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || undefined,
        dietary: dietary.length > 0 ? dietary.join(",") : undefined,
      });
      updateUser(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로필 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const inputClass =
    "w-full rounded-xl border border-[#BDD5EA] bg-white px-4 py-3 text-[#495867] placeholder:text-[#577399]/50 focus:border-[#FE5F55] focus:outline-none focus:ring-2 focus:ring-[#FE5F55]/20";

  const infoRow = (label: string, value: string | null) => (
    <div className="flex justify-between py-3 border-b border-[#BDD5EA]/30">
      <span className="text-sm font-medium text-[#577399]">{label}</span>
      <span className="text-sm text-[#495867]">{value || "-"}</span>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-start justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[#BDD5EA]/50 bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-xl font-bold text-[#495867]">내 프로필</h1>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            {success && (
              <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-600">
                프로필이 수정되었습니다.
              </p>
            )}

            {!editing ? (
              <div className="flex flex-col">
                {infoRow("이메일", user.email)}
                {infoRow("이름", user.name)}
                {infoRow("나이", user.age != null ? String(user.age) : null)}
                {infoRow("성별", user.gender)}
                {infoRow("식이 제한", user.dietary)}
                {infoRow("로그인 방식", user.provider)}

                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="mt-6 w-full rounded-full bg-[#577399] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  프로필 수정
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">이름</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">나이</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={1}
                    max={120}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">성별</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">선택 안함</option>
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">식이 제한</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DIETARY_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleDietaryToggle(item)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          dietary.includes(item)
                            ? "border-[#FE5F55] bg-[#FE5F55]/10 text-[#FE5F55]"
                            : "border-[#BDD5EA] text-[#577399] hover:border-[#577399]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 rounded-full border border-[#BDD5EA] py-3 text-sm font-semibold text-[#577399] transition-opacity hover:opacity-90"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-full bg-[#FE5F55] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e5534b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-full border border-red-200 py-3 text-sm font-semibold text-red-500 transition-opacity hover:opacity-90"
            >
              로그아웃
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
