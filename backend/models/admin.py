from pydantic  import BaseModel



class adminlogin(BaseModel):
    username: str
    password: str
    
    
    
class fetchallusers(BaseModel):
    tenant_id: int
    branch_id: int
    user_type: str

class adminfetchuser(BaseModel):
    tenant_id: int
    branch_id: int
    user_type: str
    user_id: int
    
class fetchallRouters(BaseModel):
    tenant_id: int
    branch_id: int
    
class