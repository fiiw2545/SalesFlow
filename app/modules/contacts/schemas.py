from pydantic import BaseModel, EmailStr, Field, ConfigDict


class ContactCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(pattern=r"^\+?[0-9]{10,15}$")
    age: int = Field(ge=0, le=120)


class ContactUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(pattern=r"^\+?[0-9]{10,15}$")
    age: int = Field(ge=0, le=120)
    