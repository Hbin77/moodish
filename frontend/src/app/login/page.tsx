"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { registerUser, loginUser } from "@/lib/auth-api";
import { DIETARY_OPTIONS } from "@/constants/dietary";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function TurnstileWidget({ onVerify, resetKey }: { onVerify: (token: string) => void; resetKey: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const node = containerRef.current;
    let widgetId: string | undefined;

    const tryRender = () => {
      if (window.turnstile && node) {
        widgetId = window.turnstile.render(node, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
          callback: onVerify,
          theme: "light",
        });
      }
    };

    if (window.turnstile) {
      tryRender();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          tryRender();
        }
      }, 200);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [onVerify, resetKey]);

  return <div ref={containerRef} className="flex justify-center" />;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

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
    if (!turnstileToken) {
      setError("로봇 인증을 완료해주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await loginUser({ email, password, turnstile_token: turnstileToken });
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
    if (!turnstileToken) {
      setError("로봇 인증을 완료해주세요.");
      return;
    }
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
        turnstile_token: turnstileToken!,
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

  const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleKakao = () => {
    if (!kakaoClientId) return;
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${redirectUri}&response_type=code`;
  };

  const handleGoogle = () => {
    if (!googleClientId) return;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=email+profile`;
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
                onClick={() => { setTab("login"); setError(null); setTurnstileToken(null); setTurnstileResetKey((k) => k + 1); }}
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
                onClick={() => { setTab("register"); setError(null); setTurnstileToken(null); setTurnstileResetKey((k) => k + 1); }}
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
                <TurnstileWidget onVerify={setTurnstileToken} resetKey={turnstileResetKey} />
                <button
                  type="submit"
                  disabled={submitting || !turnstileToken}
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
                  <div className="mt-1 flex gap-2">
                    {["남성", "여성", "기타"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setRegGender(regGender === g ? "" : g)}
                        className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-colors ${
                          regGender === g
                            ? "border-[#FE5F55] bg-[#FE5F55]/10 text-[#FE5F55]"
                            : "border-[#BDD5EA] text-[#577399] hover:border-[#577399]"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
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
                <TurnstileWidget onVerify={setTurnstileToken} resetKey={turnstileResetKey} />
                <button
                  type="submit"
                  disabled={submitting || !turnstileToken}
                  className="w-full rounded-full bg-[#FE5F55] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e5534b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "가입 중..." : "회원가입"}
                </button>
              </form>
            )}

            {/* OAuth */}
            {(kakaoClientId || googleClientId) && (
            <div className="mt-6 flex flex-col gap-3">
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#BDD5EA]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[#577399]">또는</span>
                </div>
              </div>
              {kakaoClientId && (
              <button
                type="button"
                onClick={handleKakao}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] py-3 text-sm font-semibold text-[#3C1E1E] transition-opacity hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.54 2 10.84c0 2.77 1.86 5.21 4.66 6.6l-1.2 4.42c-.1.38.32.68.65.47l5.27-3.46c.2.02.4.03.62.03 5.52 0 10-3.54 10-7.9S17.52 3 12 3z" />
                </svg>
                카카오로 시작하기
              </button>
              )}
              {googleClientId && (
              <button
                type="button"
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#BDD5EA] bg-white py-3 text-sm font-semibold text-[#495867] transition-opacity hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                구글로 시작하기
              </button>
              )}
            </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
