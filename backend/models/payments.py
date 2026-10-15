from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional

class CheckoutRequest(BaseModel):
    """Validates form parameters pushed from your React captive portal landing page."""
    tenant_id: int
    branch_id: int
    router_id: int
    package_id: int
    buyer_id: int
    phone_number: str = Field(..., max_length=30, json_schema_extra={"example": "0712345678"})
    provider: str = Field(..., description="Must match: Airtel, Tigo, Halopesa, Azampesa, or Mpesa")

class PortalBuyerRequest(BaseModel):
    tenant_id: int
    buyer_mac: str = Field(..., min_length=1, max_length=50)
    phone_number: str = Field(..., min_length=1, max_length=30)

class PaymentHistoryResponse(BaseModel):
    """Defines the rigid, data-validated structure outputted to your billing history grid."""
    id: int
    tenant_id: int
    branch_id: int
    router_id: int
    package_id: int
    buyer_id: int
    amount: float
    payment_gateway: str
    gateway_reference: str
    status: str
    auth_token: str
    created_at: datetime
    
    # Joined attributes fetched out of the buyers database layer
    buyer_mac: str = Field(..., description="The network identification device MAC signature")
    phone_number: Optional[str] = Field(None, description="The mobile wallet checkout account number")
