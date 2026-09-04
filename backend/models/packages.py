from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

class PackageRegister(BaseModel):
    """Validates form data payload sent from the UI to create a package bundle."""
    package_name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=100)
    price: Decimal = Field(..., description="Cost required by client checkouts")
    duration_seconds: int = Field(..., description="Access lifespan window in seconds")
    data_quota_bytes: int = Field(default=0, description="0 means completely unlimited data")
    mikrotik_rate_limit: Optional[str] = Field(None, max_length=50)
    wifidog_max_down_bandwidth: Optional[int] = Field(None)
    wifidog_max_up_bandwidth: Optional[int] = Field(None)
    status: str = Field(default="active")

class PackageUpdate(BaseModel):
    """Validates modifications sent from the dashboard view for an existing bundle."""
    package_id: int
    package_name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    duration_seconds: Optional[int] = None
    data_quota_bytes: Optional[int] = None
    mikrotik_rate_limit: Optional[str] = None
    wifidog_max_down_bandwidth: Optional[int] = None
    wifidog_max_up_bandwidth: Optional[int] = None
    status: Optional[str] = None

class PackageDelete(BaseModel):
    """Validates a request schema payload intended to remove a catalog bundle profile."""
    package_id: int

class PackageResponse(BaseModel):
    """Defines the uniform array payload model structure outputted to your UI frames."""
    id: int
    tenant_id: int
    package_name: str
    description: Optional[str]
    price: float
    duration_seconds: int
    data_quota_bytes: int
    mikrotik_rate_limit: Optional[str]
    wifidog_max_down_bandwidth: Optional[int]
    wifidog_max_up_bandwidth: Optional[int]
    status: str
    created_at: datetime
