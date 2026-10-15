from pydantic import BaseModel


class BranchRegister(BaseModel):
    tenant_id: int
    branch_name: str
    branch_location: str
    branch_email: str
    branch_phone: str
    branch_manager: str


class BranchUpdate(BaseModel):
    tenant_id: int
    branch_id: int
    branch_name: str
    branch_location: str
    branch_email: str
    branch_phone: str
    branch_manager: str


class BranchDelete(BaseModel):
    tenant_id: int
    branch_id: int


class BranchGet(BaseModel):
    tenant_id: int
    branch_id: int | None = None
