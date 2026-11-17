from pydantic import BaseModel


class LineLinkCodeResponse(BaseModel):
    code: str
    expires_in: int
    message: str


class LineStatusResponse(BaseModel):
    connected: bool


class LineConnectionResponse(BaseModel):
    message: str