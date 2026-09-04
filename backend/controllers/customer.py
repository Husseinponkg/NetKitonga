from typing import List, Dict, Any
from fastapi import HTTPException, status
from models.customers import DeleteCustomer
from services.customers import CustomerService

class CustomerController:
    def __init__(self):
        self.customer_service = CustomerService()

    async def list_customers(self, tenant_id: int) -> List[Dict[str, Any]]:
        """Retrieves and processes client records matching tenant profile footprints."""
        return await self.customer_service.get_all_tenant_buyers(tenant_id)

    async def remove_customer(self, payload: DeleteCustomer) -> Dict[str, Any]:
        """Validates deletion success criteria or triggers error handling rules."""
        success = await self.customer_service.delete_buyer_record(payload)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Customer profile not found or unassigned to your tenant account portfolio."
            )
        return {"message": "Customer device registry row removed successfully from database."}
