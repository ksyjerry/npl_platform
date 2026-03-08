from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    member_type: str  # seller | buyer | accountant
    name: str
    company_name: str
    department: str
    title: str
    phone_office: str
    phone_mobile: str
    email: EmailStr
    password: str
    password_confirm: str
    interests: list[str] = []
    terms_1: bool
    terms_2: bool
    terms_3: bool

    @field_validator("member_type")
    @classmethod
    def validate_member_type(cls, v: str) -> str:
        if v not in ("seller", "buyer", "accountant"):
            raise ValueError("회원유형은 seller, buyer, accountant 중 하나여야 합니다.")
        return v

    @field_validator("password")
    @classmethod
    def pw_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("비밀번호는 최소 6자 이상이어야 합니다.")
        return v

    @field_validator("terms_1", "terms_2", "terms_3")
    @classmethod
    def terms_must_agree(cls, v: bool) -> bool:
        if not v:
            raise ValueError("약관에 동의해주세요.")
        return v


class RegisterResponse(BaseModel):
    id: int
    email: str
    role: str
    is_verified: bool


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
