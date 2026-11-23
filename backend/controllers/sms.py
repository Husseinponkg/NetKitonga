from typing import List, Dict, Any
from fastapi import HTTPException

from services.sms import SMSService


class SMSController:
    def __init__(self):
        self.service = SMSService()

    async def get_credits(self, tenant_id: int) -> Dict[str, Any]:
        balance = await self.service.get_credits(tenant_id)
        return {"tenant_id": tenant_id, "balance": balance, "cost_per_sms": self.service.sell_price}

    async def buy_credits(self, tenant_id: int, count: int) -> Dict[str, Any]:
        new_balance = await self.service.add_credits(tenant_id, count)
        return {"tenant_id": tenant_id, "balance": new_balance, "purchased": count}

    async def send_single(self, tenant_id: int, phone_numbers: List[str], text: str, reference: str = "") -> Dict[str, Any]:
        count = len(phone_numbers)
        if not await self.service.deduct_credits(tenant_id, count):
            raise HTTPException(status_code=400, detail=f"Insufficient SMS credits. Need {count}, have less.")
        try:
            result = self.service.send_single(phone_numbers, text, reference or f"sms-{tenant_id}")
            return {"success": True, "result": result, "credits_used": count}
        except Exception as e:
            await self.service.add_credits(tenant_id, count)
            raise

    async def send_multi(self, tenant_id: int, messages: List[Dict[str, str]], reference: str = "") -> Dict[str, Any]:
        count = len(messages)
        if not await self.service.deduct_credits(tenant_id, count):
            raise HTTPException(status_code=400, detail=f"Insufficient SMS credits. Need {count}, have less.")
        try:
            result = self.service.send_multi(messages, reference or f"sms-{tenant_id}")
            return {"success": True, "result": result, "credits_used": count}
        except Exception as e:
            await self.service.add_credits(tenant_id, count)
            raise

    async def check_balance(self) -> Dict[str, Any]:
        return self.service.check_balance()
