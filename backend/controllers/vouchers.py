from typing import List

from fastapi import HTTPException

from models.vouchers import VoucherCreate
from services.vouchers import VoucherService


class VoucherController:
    def __init__(self):
        self.service = VoucherService()

    async def create(self, tenant_id: int, data: VoucherCreate) -> List[dict]:
        try:
            return await self.service.create_vouchers(tenant_id, data)
        except ValueError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    async def list(self, tenant_id: int) -> List[dict]:
        return await self.service.list_vouchers(tenant_id)