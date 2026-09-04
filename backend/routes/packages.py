from fastapi import APIRouter, Query, status
from typing import List, Dict, Any
from models.packages import PackageRegister, PackageUpdate, PackageDelete, PackageResponse
from controllers.packages import PackageController

package_endpoints = APIRouter()
controller = PackageController()

@package_endpoints.post("/create", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def handle_package_creation(package_data: PackageRegister, tenant_id: int = Query(...)):
    """Creates a fresh bandwidth throttling profile template bound to a specific tenant ID."""
    return await controller.add_package_to_catalog(tenant_id, package_data)

@package_endpoints.get("/catalog", response_model=List[PackageResponse])
async def handle_get_tenant_catalog(tenant_id: int = Query(...)):
    """Exposes all packages configured inside a single tenant's business registry portfolio."""
    return await controller.fetch_tenant_catalog(tenant_id)

@package_endpoints.put("/update", response_model=Dict[str, Any])
async def handle_package_updates(package_data: PackageUpdate, tenant_id: int = Query(...)):
    """Modifies custom details or bandwidth queues dynamically across data fields."""
    return await controller.modify_catalog_package(tenant_id, package_data)

@package_endpoints.delete("/delete", response_model=Dict[str, Any])
async def handle_package_removal(package_data: PackageDelete, tenant_id: int = Query(...)):
    """Purges package entries out of the system environment using isolated identity parameters."""
    return await controller.remove_catalog_package(tenant_id, package_data)