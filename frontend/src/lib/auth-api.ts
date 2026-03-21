export interface RegisterData {
  email: string;
  password: string;
  name: string;
  age?: number;
  gender?: string;
  dietary?: string;
  turnstile_token: string;
}

export interface LoginData {
  email: string;
  password: string;
  turnstile_token: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  age: number | null;
  gender: string | null;
  dietary: string | null;
  provider: string;
}

export interface UpdateProfileData {
  name?: string;
  age?: number;
  gender?: string;
  dietary?: string;
}

const API_BASE = "/api/auth";

export async function registerUser(data: RegisterData): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "회원가입에 실패했습니다.");
  }
  return res.json();
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "로그인에 실패했습니다.");
  }
  return res.json();
}

export async function kakaoLogin(
  code: string,
  redirectUri: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/kakao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "카카오 로그인에 실패했습니다.");
  }
  return res.json();
}

export async function googleLogin(
  code: string,
  redirectUri: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "구글 로그인에 실패했습니다.");
  }
  return res.json();
}

export async function getProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("프로필을 가져오는 데 실패했습니다.");
  }
  return res.json();
}

export async function updateProfile(
  token: string,
  data: UpdateProfileData
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "프로필 수정에 실패했습니다.");
  }
  return res.json();
}
