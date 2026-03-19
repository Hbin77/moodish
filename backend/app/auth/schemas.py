from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(min_length=6, max_length=100)
    name: str = Field(max_length=100)
    age: int | None = Field(default=None, ge=1, le=120)
    gender: str | None = Field(default=None, max_length=10)
    dietary: str | None = Field(default=None, max_length=500)
    turnstile_token: str


class UserLogin(BaseModel):
    email: str
    password: str
    turnstile_token: str


class UserProfile(BaseModel):
    id: int
    email: str
    name: str
    age: int | None
    gender: str | None
    dietary: str | None
    provider: str


class UserUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    dietary: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class OAuthCallback(BaseModel):
    code: str
    redirect_uri: str
