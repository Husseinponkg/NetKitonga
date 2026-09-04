from pydantic import BaseModel

class TenantRegister(BaseModel):
    business_name: str
    system_name: str
    email: str
    password: str

class TenantLogin(BaseModel):
    email: str
    password: str

class TenantUpdate(BaseModel):
    business_name: str
    system_name: str
    email: str
    password: str

class TenantDelete(BaseModel):
    id: int
