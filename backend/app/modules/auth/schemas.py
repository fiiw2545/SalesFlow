from pydantic import BaseModel, EmailStr, Field, field_validator

class RegisterRequest(BaseModel):
    name: str = Field(
        min_length=2,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


class RegisterResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    message: str


class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


class LoginResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    message: str


class LogoutResponse(BaseModel):
    message: str


class RefreshResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    message: str

class UpdateProfileRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Name must contain at least 2 characters")

        return value


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class ProfileUpdateResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    message: str


class ChangePasswordResponse(BaseModel):
    message: str