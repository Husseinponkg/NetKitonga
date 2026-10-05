from fastapi import APIRouter, Query

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
async def getall_branches(tenant_id: int = Query(..., description="The tenant ID from the logged-in session")) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.getall_branches(tenant_id=tenant_id)
    return result


@router.get("/all/")
async def getall_branches_slash(tenant_id: int = Query(..., description="The tenant ID from the logged-in session")) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.getall_branches(tenant_id=tenant_id)
    return result


@router.get("")
async def get_branch(tenant_id: int = Query(..., description="The tenant ID from the logged-in session"), branch_id: int = Query(..., description="The branch ID to retrieve")) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.get_branch(tenant_id=tenant_id, branch_id=branch_id)
    return result


@router.get("/")
async def get_branch_slash(tenant_id: int = Query(..., description="The tenant ID from the logged-in session"), branch_id: int = Query(..., description="The branch ID to retrieve")) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.get_branch(tenant_id=tenant_id, branch_id=branch_id)
    return result


@router.get("/earnings")
async def get_branch_earnings(tenant_id: int = Query(..., description="The tenant ID from the logged-in session")) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.get_branch_earnings(tenant_id=tenant_id)
    return result


@router.get("/earnings/")
async def get_branch_earnings_slash(tenant_id: int = Query(..., description="The tenant ID from the logged-in session")) -> dict:
    branch_controller = BranchController()
    result = await branch_controller.get_branch_earnings(tenant_id=tenant_id)
    return result
