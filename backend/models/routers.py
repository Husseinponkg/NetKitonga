from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RouterRegister(BaseModel):
    """
    Validates data sent from the user interface when a tenant 
    registers a brand new router on the frontend form.
    """
    # 1. Multi-Tenant Identity Fields
    tenant_id: int = Field(..., description="The unique identity token of the business owner")
    branch_id: int = Field(..., description="The business branch/location where this router sits")
    router_name: str = Field(..., max_length=100, json_schema_extra={"example": "Main Lobby AP"})
    
    # 2. Driver Engine Protocol Switcher
    driver_type: str = Field(..., description="Must be exactly 'radius_aaa' or 'wifidog_http'")
    
    # 3. Asymmetric Vendor Properties (Marked Optional with default None)
    nas_identifier: Optional[str] = Field(None, max_length=100, description="Used only for MikroTik/RADIUS setups")
    radius_secret: Optional[str] = Field(None, max_length=100, description="Shared password for RADIUS handshakes")
    gw_id: Optional[str] = Field(None, max_length=100, description="Gateway ID used only for Ruijie/Wifidog setups")
    
    # 4. Hardware Tracking Parameters
    mac_address: str = Field(..., max_length=50, json_schema_extra={"example": "AA:BB:CC:11:22:33"})
    is_licensed: bool = Field(default=True, description="Tracks if extra router additions have been paid for")
    status: str = Field(default="offline", description="Defaults to offline until the first heartbeat lands")
    
    # 5. System Meta Fields
    last_heartbeat_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Enables automated ORM mode parsing from SQLAlchemy records."""
        from_attributes = True
class RouterUpdate(BaseModel):
    """
    Validates data sent from the user interface when a tenant 
    updates an existing router on the frontend form.
    """
    # 1. Multi-Tenant Identity Fields
    router_id: int = Field(..., description="The unique identity token of the router to be updated")
    
    # 2. Optional Update Fields (All fields are optional for partial updates)
    router_name: Optional[str] = Field(None, max_length=100, json_schema_extra={"example": "Main Lobby AP"})
    driver_type: Optional[str] = Field(None, description="Must be exactly 'radius_aaa' or 'wifidog_http'")
    nas_identifier: Optional[str] = Field(None, max_length=100, description="Used only for MikroTik/RADIUS setups")
    radius_secret: Optional[str] = Field(None, max_length=100, description="Shared password for RADIUS handshakes")
    gw_id: Optional[str] = Field(None, max_length=100, description="Gateway ID used only for Ruijie/Wifidog setups")
    mac_address: Optional[str] = Field(None, max_length=50, json_schema_extra={"example": "AA:BB:CC:11:22:33"})
    is_licensed: Optional[bool] = Field(None, description="Tracks if extra router additions have been paid for")
    status: Optional[str] = Field(None, description="Tracks the current operational status of the router")
    
    # 3. System Meta Fields
    last_heartbeat_at: Optional[datetime] = Field(default=None)
class RouterDelete(BaseModel):
    """
    Validates data sent from the user interface when a tenant 
    deletes an existing router on the frontend form.
    """
    # 1. Multi-Tenant Identity Fields
    router_id: int = Field(..., description="The unique identity token of the router to be deleted")
    
class RouterResponse(BaseModel):
     router_id: int
     router_name: str
     status: str
     last_heartbeat: Optional[str]
 