from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WithdrawalRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount to withdraw, must be greater than 0")
    mobile_money_number: str = Field(..., max_length=30)
    payout_provider: str = Field(..., description="e.g. Mpesa, AirtelMoney")

class WithdrawalUpdate(BaseModel):
    withdrawal_id: int
    status: str = Field(..., description="approved or rejected")
    transaction_reference: Optional[str] = None

class WithdrawalResponse(BaseModel):
    id: int
    tenant_id: int
    wallet_id: int
    amount: float
    mobile_money_number: str
    payout_provider: str
    transaction_reference: Optional[str]
    status: str
    created_at: datetime
