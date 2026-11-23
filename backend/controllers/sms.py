from typing import List, Dict, Any
from fastapi import HTTPException

from services.sms import SMSService


class SMSController:
    def __init__(self):
        self.service = SMSService()

    async def send_single(self, tenant_id: int, phone_numbers: List[str], text: str, reference: str = "") -> Dict[str, Any]:
        result = self.service.send_single(phone_numbers, text, reference or f"sms-{tenant_id}")
        return {"success": True, "result": result}

    async def send_multi(self, tenant_id: int, messages: List[Dict[str, str]], reference: str = "") -> Dict[str, Any]:
        result = self.service.send_multi(messages, reference or f"sms-{tenant_id}")
        return {"success": True, "result": result}
