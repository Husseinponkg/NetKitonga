from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SessionResponse(BaseModel):
    id: int
    session_id: str
    router_id: int
    router_name: Optional[str] = None
    buyer_id: int
    buyer_mac: str
    assigned_ip: str
    bytes_uploaded: int
    bytes_downloaded: int
    start_time: datetime
    expiration_time: datetime
    status: str

class SessionTerminate(BaseModel):
    tenant_id: int
    session_id: int
