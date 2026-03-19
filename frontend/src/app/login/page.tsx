"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { registerUser, loginUser } from "@/lib/auth-api";

const DIETARY_OPTIONS = [
  "채식",
  "글루텐프리",
  "유제품프리",
  "할랄",
  "해산물 알레르기",
  "견과류 알레르기",
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register fields
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regGender, setRegGender] = useState("");
  const [regDietary, setRegDietary] = useState<string[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await loginUser({ email, password });
      login(res.access_token, res.user);
      router.push("/mood");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await registerUser({
        email: regEmail,
        password: regPassword,
        name: regName,
        age: regAge ? parseInt(regAge, 10) : undefined,
        gender: regGender || undefined,
        dietary: regDietary.length > 0 ? regDietary.join(",") : undefined,
      });
      login(res.access_token, res.user);
      router.push("/mood");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDietaryToggle = (item: string) => {
    setRegDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
    );
  };

  const handleKakao = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  };

  const handleGoogle = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email+profile`;
  };

  const inputClass =
    "w-full rounded-xl border border-[#BDD5EA] bg-white px-4 py-3 text-[#495867] placeholder:text-[#577399]/50 focus:border-[#FE5F55] focus:outline-none focus:ring-2 focus:ring-[#FE5F55]/20";

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-start justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[#BDD5EA]/50 bg-white p-8 shadow-sm">
            {/* Tabs */}
            <div className="mb-6 flex rounded-xl bg-[#F7F7FF] p-1">
              <button
                type="button"
                onClick={() => { setTab("login"); setError(null); }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  tab === "login"
                    ? "bg-white text-[#495867] shadow-sm"
                    : "text-[#577399]"
                }`}
              >
                이메일 로그인
              </button>
              <button
                type="button"
                onClick={() => { setTab("register"); setError(null); }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  tab === "register"
                    ? "bg-white text-[#495867] shadow-sm"
                    : "text-[#577399]"
                }`}
              >
                회원가입
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Login Form */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">
                    이메일
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#FE5F55] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e5534b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "로그인 중..." : "로그인"}
                </button>
              </form>
            )}

            {/* Register Form */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">
                    이메일
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="example@email.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">
                    이름
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">
                    나이 (선택)
                  </label>
                  <input
                    type="number"
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    placeholder="나이"
                    min={1}
                    max={120}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">
                    성별 (선택)
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">선택 안함</option>
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#577399]">
                    식이 제한 (선택)
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DIETARY_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleDietaryToggle(item)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          regDietary.includes(item)
                            ? "border-[#FE5F55] bg-[#FE5F55]/10 text-[#FE5F55]"
                            : "border-[#BDD5EA] text-[#577399] hover:border-[#577399]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#FE5F55] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e5534b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "가입 중..." : "회원가입"}
                </button>
              </form>
            )}

            {/* OAuth */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#BDD5EA]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[#577399]">또는</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleKakao}
                className="w-full rounded-full bg-[#FEE500] py-3 text-sm font-semibold text-[#3C1E1E] transition-opacity hover:opacity-90"
              >
                카카오로 시작하기
              </button>
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full rounded-full border border-[#BDD5EA] bg-white py-3 text-sm font-semibold text-[#495867] transition-opacity hover:opacity-90"
              >
                구글로 시작하기
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
