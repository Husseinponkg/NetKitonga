from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class GetcustomerData(BaseModel):
    id: int
    tenant_id: int
    buyer_mac: str
    phone_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DeleteCustomer(BaseModel):
    id: int = Field(..., description="The unique database primary key ID of the buyer row to delete")
    tenant_id: int = Field(..., description="The tenant context ID ensuring safe isolation")
