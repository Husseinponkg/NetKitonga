from pydantic import BaseModel
from typing import Optional


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminResponse(BaseModel):
    id: int
    email: str
    name: str
    message: Optional[str] = None
