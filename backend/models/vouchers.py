from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VoucherCreate(BaseModel):
    package_id: int
    quantity: int = Field(default=1, ge=1, le=500)
    expires_at: Optional[datetime] = None


class VoucherResponse(BaseModel):
    id: int
    tenant_id: int
    package_id: int
    package_name: str
    code: str
    status: str
    expires_at: Optional[datetime] = None
    redeemed_at: Optional[datetime] = None
    created_at: datetime