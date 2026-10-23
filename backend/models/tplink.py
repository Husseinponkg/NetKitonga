from pydantic import BaseModel, Field
from typing import Optional
from ipaddress import IPv4Address, IPv6Address
from datetime import datetime


class TplinkRegister(BaseModel):
    tenant_id: int = Field(..., description="The unique identity token of the business owner")
    branch_id: int = Field(..., description="The business branch/location where this device sits")
    router_id: int = Field(..., description="The linked router id for this TP-Link device")
    device_name: str = Field(..., max_length=100, json_schema_extra={"example": "Lobby EAP225"})
    mac_address: str = Field(..., max_length=50, json_schema_extra={"example": "AA:BB:CC:11:22:33"})
    ip_address: IPv4Address | IPv6Address = Field(..., description="The physical device IP address")
    nas_identifier: Optional[str] = Field(None, max_length=100, description="NAS ID used for RADIUS")
    radius_secret: Optional[str] = Field(None, max_length=100, description="Shared secret for RADIUS")
    portal_url: Optional[str] = Field(None, max_length=255, description="External captive portal URL")
    status: str = Field(default="offline", description="Defaults to offline until heartbeat")
    last_heartbeat_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


class TplinkUpdate(BaseModel):
    tplink_id: int = Field(..., description="The unique identity token of the device to be updated")
    device_name: Optional[str] = Field(None, max_length=100)
    branch_id: Optional[int] = None
    router_id: Optional[int] = None
    mac_address: Optional[str] = Field(None, max_length=50)
    ip_address: Optional[IPv4Address | IPv6Address] = None
    nas_identifier: Optional[str] = Field(None, max_length=100)
    radius_secret: Optional[str] = Field(None, max_length=100)
    portal_url: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = None
    last_heartbeat_at: Optional[datetime] = None


class TplinkDelete(BaseModel):
    tplink_id: int = Field(..., description="The unique identity token of the device to be deleted")


class TplinkResponse(BaseModel):
    message: Optional[str] = None
    tplink_id: int
    device_name: Optional[str] = None
    status: str
    last_heartbeat: Optional[str] = None
