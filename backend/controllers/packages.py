from typing import List, Dict, Any
from fastapi import HTTPException
from models.packages import PackageRegister, PackageUpdate, PackageDelete
from services.packages import PackageService

class PackageController:
    def __init__(self):
        self.package_service = PackageService()

    async def add_package_to_catalog(self, tenant_id: int, package_data: PackageRegister) -> Dict[str, Any]:
        await self.package_service.create_package(tenant_id, package_data)
        return {"message": " hotspot internet pricing bundle created successfully inside product tables."}

    async def fetch_tenant_catalog(self, tenant_id: int) -> List[Dict[str, Any]]:
        return await self.package_service.get_all_tenant_packages(tenant_id)

    async def modify_catalog_package(self, tenant_id: int, package_data: PackageUpdate) -> Dict[str, Any]:
        success = await self.package_service.update_package(tenant_id, package_data)
        if not success:
            raise HTTPException(status_code=404, detail="Target catalog bundle profile matching parameters not found.")
        return {"message": "Package values synchronized across product profiles."}

    async def remove_catalog_package(self, tenant_id: int, package_data: PackageDelete) -> Dict[str, Any]:
        success = await self.package_service.delete_package(tenant_id, package_data)
        if not success:
            raise HTTPException(status_code=404, detail="Target catalog bundle profile matching parameters not found.")
        return {"message": "Package profile successfully removed from product tables."}