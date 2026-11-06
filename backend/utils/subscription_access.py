from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request

from config.db import connection


async def require_active_subscription(request: Request) -> None:
    tenant_id = request.query_params.get("tenant_id")
    payload = None
    if not tenant_id and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        try:
            body = await request.json()
        except ValueError:
            body = None
        if isinstance(body, dict):
            payload = body
            tenant_id = body.get("tenant_id")

    resource_id = None
    resource_table = None
    resource_column = None
    path = request.url.path
    if not tenant_id and path.startswith("/routers/"):
        resource_id = request.query_params.get("router_id") or (payload or {}).get("router_id")
        resource_table, resource_column = "routers", "id"
    elif not tenant_id and path.startswith("/tplink/"):
        resource_id = request.query_params.get("tplink_id") or (payload or {}).get("tplink_id")
        resource_table, resource_column = "tplink", "id"

    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            if tenant_id:
                try:
                    tenant_id = int(tenant_id)
                except (TypeError, ValueError) as error:
                    raise HTTPException(status_code=400, detail="Invalid tenant ID.") from error
            elif resource_id and resource_table:
                try:
                    resource_id = int(resource_id)
                except (TypeError, ValueError) as error:
                    raise HTTPException(status_code=400, detail="Invalid resource ID.") from error
                await cursor.execute(
                    f"SELECT tenant_id FROM {resource_table} WHERE {resource_column} = %s;",
                    (resource_id,),
                )
                owner = await cursor.fetchone()
                if not owner:
                    raise HTTPException(status_code=404, detail="Tenant resource not found.")
                tenant_id = owner[0]
            else:
                raise HTTPException(status_code=400, detail="Tenant ID is required.")

            await cursor.execute(
                """
                SELECT subscription_status, subscription_expires_at, created_at
                FROM tenants
                WHERE id = %s;
                """,
                (tenant_id,),
            )
            tenant = await cursor.fetchone()
            if not tenant:
                raise HTTPException(status_code=404, detail="Tenant not found.")
            status, expires_at, created_at = tenant
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            paid_active = status == "active" and expires_at is not None and expires_at > now
            trial_active = expires_at is None and now < created_at + timedelta(days=30)
            if not paid_active and not trial_active:
                raise HTTPException(
                    status_code=402,
                    detail="Subscription expired. Pay the monthly subscription to continue.",
                )
    finally:
        await conn.close()
