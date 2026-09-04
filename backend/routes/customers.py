from fastapi import APIRouter, Query, status
from typing import List, Dict, Any
from models.customers import GetcustomerData, DeleteCustomer
from controllers.customer import CustomerController

customer_endpoints = APIRouter()
controller = CustomerController()

@customer_endpoints.get("/list", response_model=List[GetcustomerData])
async def handle_get_customers(tenant_id: int = Query(..., description="The unique ID of the business landlord tenant")):
    """Exposes all discovered consumer mobile mac/phone devices active for a tenant's dashboard framework."""
    return await controller.list_customers(tenant_id)

@customer_endpoints.delete("/delete", response_model=Dict[str, Any])
async def handle_customer_removal(payload: DeleteCustomer):
    """Purges target customer entries out of PostgreSQL storage blocks safely via structural payload variables."""
    return await controller.remove_customer(payload)
