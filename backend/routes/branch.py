from fastapi import APIRouter

from backend.controllers.branch import BranchController
from backend.models.branch import BranchRegister, BranchUpdate, BranchDelete

router = APIRouter()

@router.post("/create")
async def create_branch(branch: BranchRegister) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.create_branch(
        tenant_id=branch.tenant_id,
        branch_name=branch.branch_name,
        branch_location=branch.branch_location,
        branch_email=branch.branch_email,
        branch_phone=branch.branch_phone,
        branch_manager=branch.branch_manager,
    )
    return result

@router.put("/update")
async def update_branch(branch: BranchUpdate) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.update_branch(
        tenant_id=branch.tenant_id,
        branch_id=branch.branch_id,
        branch_name=branch.branch_name,
        branch_location=branch.branch_location,
        branch_email=branch.branch_email,
        branch_phone=branch.branch_phone,
        branch_manager=branch.branch_manager,
    )
    return result

@router.delete("/delete")
async def delete_branch(branch: BranchDelete) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.delete_branch(
        tenant_id=branch.tenant_id,
        branch_id=branch.branch_id,
    )
    return result

@router.get("/all")
async def getall_branches(tenant_id: int) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.getall_branches(tenant_id=tenant_id)
    return result

@router.get("")
async def get_branch(tenant_id: int) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.get_branch(tenant_id=tenant_id, branch_id=1)
    return result
