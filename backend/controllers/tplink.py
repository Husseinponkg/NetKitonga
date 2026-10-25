
from typing import Dict, Any

from fastapi import HTTPException

from config.db import connection
from models.tplink import (
    TplinkRegister,
    TplinkUpdate,
    TplinkDelete,
    TplinkResponse,
)
from services.tplink import TplinkService


class TplinkController:

    def __init__(self):
        self.tplink_service = TplinkService()

    # ============================================================
    # REGISTER TP-LINK DEVICE
    # ============================================================

    async def register_tplink(
        self,
        data: TplinkRegister,
    ) -> Dict[str, Any]:

        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                # ------------------------------------------------
                # 1. Verify that the linked router belongs to the
                #    same tenant and branch.
                # ------------------------------------------------

                await cursor.execute(
                    """
                    SELECT id
                    FROM routers
                    WHERE id = %s
                      AND tenant_id = %s
                      AND branch_id = %s;
                    """,
                    (
                        data.router_id,
                        data.tenant_id,
                        data.branch_id,
                    ),
                )

                router = await cursor.fetchone()

                if not router:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "The selected router was not found "
                            "for the specified tenant and branch."
                        ),
                    )

                # ------------------------------------------------
                # 2. Register TP-Link device.
                # ------------------------------------------------

                query = """
                    INSERT INTO tplink (
                        tenant_id,
                        branch_id,
                        router_id,
                        device_name,
                        mac_address,
                        ip_address,
                        nas_identifier,
                        radius_secret,
                        portal_url,
                        status,
                        last_heartbeat_at
                    )
                    VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s
                    )
                    RETURNING id;
                """

                params = (
                    data.tenant_id,
                    data.branch_id,
                    data.router_id,
                    data.device_name,
                    data.mac_address,
                    str(data.ip_address),
                    data.nas_identifier,
                    data.radius_secret,
                    data.portal_url,
                    data.status,
                    data.last_heartbeat_at,
                )

                await cursor.execute(query, params)

                row = await cursor.fetchone()

                if not row:
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to register TP-Link device.",
                    )

                new_id = row[0]

                # ------------------------------------------------
                # 3. Synchronize the linked router's RADIUS
                #    configuration.
                #
                #    This updates only the router linked to this
                #    TP-Link device.
                # ------------------------------------------------

                await cursor.execute(
                    """
                    UPDATE routers
                    SET
                        nas_identifier = COALESCE(
                            %s, nas_identifier
                        ),
                        radius_secret = COALESCE(
                            %s, radius_secret
                        ),
                        driver_type = 'tplink_radius'
                    WHERE id = %s
                      AND tenant_id = %s
                      AND branch_id = %s;
                    """,
                    (
                        data.nas_identifier,
                        data.radius_secret,
                        data.router_id,
                        data.tenant_id,
                        data.branch_id,
                    ),
                )

                if cursor.rowcount != 1:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Could not synchronize the linked "
                            "router configuration."
                        ),
                    )

                # ------------------------------------------------
                # 4. Generate TP-Link portal configuration.
                # ------------------------------------------------

                config = self.tplink_service.build_config(
                    device_name=data.device_name,
                    ip_address=str(data.ip_address),
                    nas_identifier=(
                        data.nas_identifier or data.device_name
                    ),
                    radius_secret=data.radius_secret or "",
                    portal_url=data.portal_url or "",
                    router_id=data.router_id,
                    tenant_id=data.tenant_id,
                    branch_id=data.branch_id,
                )

                await conn.commit()

                return {
                    "message": (
                        "TP-Link device registered successfully."
                    ),
                    "tplink_id": new_id,
                    "configuration": config,
                }

        except HTTPException:
            await conn.rollback()
            raise

        except Exception as exc:
            await conn.rollback()

            raise HTTPException(
                status_code=400,
                detail=f"TP-Link registration failed: {str(exc)}",
            )

        finally:
            await conn.close()

    # ============================================================
    # UPDATE TP-LINK DEVICE
    # ============================================================

    async def update_tplink(
        self,
        data: TplinkUpdate,
    ) -> TplinkResponse:

        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                # -----------------------------------------------
                # 1. Retrieve the current device and its tenant.
                # -----------------------------------------------

                await cursor.execute(
                    """
                    SELECT
                        id,
                        tenant_id,
                        branch_id,
                        router_id,
                        nas_identifier,
                        radius_secret
                    FROM tplink
                    WHERE id = %s;
                    """,
                    (data.tplink_id,),
                )

                current = await cursor.fetchone()

                if not current:
                    raise HTTPException(
                        status_code=404,
                        detail="TP-Link device not found.",
                    )

                (
                    current_id,
                    tenant_id,
                    current_branch_id,
                    current_router_id,
                    current_nas_identifier,
                    current_radius_secret,
                ) = current

                target_branch_id = (
                    data.branch_id
                    if data.branch_id is not None
                    else current_branch_id
                )

                target_router_id = (
                    data.router_id
                    if data.router_id is not None
                    else current_router_id
                )

                # -----------------------------------------------
                # 2. Validate the new router/branch relationship
                #    before changing the device.
                # -----------------------------------------------

                if (
                    data.router_id is not None
                    or data.branch_id is not None
                ):
                    await cursor.execute(
                        """
                        SELECT id
                        FROM routers
                        WHERE id = %s
                          AND tenant_id = %s
                          AND branch_id = %s;
                        """,
                        (
                            target_router_id,
                            tenant_id,
                            target_branch_id,
                        ),
                    )

                    if not await cursor.fetchone():
                        raise HTTPException(
                            status_code=400,
                            detail=(
                                "The selected router does not "
                                "belong to this tenant and branch."
                            ),
                        )

                # -----------------------------------------------
                # 3. Update the TP-Link device.
                # -----------------------------------------------

                query = """
                    UPDATE tplink
                    SET
                        device_name = COALESCE(
                            %s, device_name
                        ),
                        branch_id = COALESCE(
                            %s, branch_id
                        ),
                        router_id = COALESCE(
                            %s, router_id
                        ),
                        mac_address = COALESCE(
                            %s, mac_address
                        ),
                        ip_address = COALESCE(
                            %s, ip_address
                        ),
                        nas_identifier = COALESCE(
                            %s, nas_identifier
                        ),
                        radius_secret = COALESCE(
                            %s, radius_secret
                        ),
                        portal_url = COALESCE(
                            %s, portal_url
                        ),
                        status = COALESCE(
                            %s, status
                        ),
                        last_heartbeat_at = COALESCE(
                            %s, last_heartbeat_at
                        )
                    WHERE id = %s
                    RETURNING id, status;
                """

                params = (
                    data.device_name,
                    data.branch_id,
                    data.router_id,
                    data.mac_address,
                    (
                        str(data.ip_address)
                        if data.ip_address is not None
                        else None
                    ),
                    data.nas_identifier,
                    data.radius_secret,
                    data.portal_url,
                    data.status,
                    data.last_heartbeat_at,
                    data.tplink_id,
                )

                await cursor.execute(query, params)

                updated = await cursor.fetchone()

                if not updated:
                    raise HTTPException(
                        status_code=404,
                        detail="TP-Link device not found.",
                    )

                # -----------------------------------------------
                # 4. Synchronize RADIUS settings on the linked
                #    router only when relevant fields change.
                # -----------------------------------------------

                if (
                    data.router_id is not None
                    or data.branch_id is not None
                    or data.nas_identifier is not None
                    or data.radius_secret is not None
                ):
                    new_nas_identifier = (
                        data.nas_identifier
                        if data.nas_identifier is not None
                        else current_nas_identifier
                    )

                    new_radius_secret = (
                        data.radius_secret
                        if data.radius_secret is not None
                        else current_radius_secret
                    )

                    await cursor.execute(
                        """
                        UPDATE routers
                        SET
                            nas_identifier = COALESCE(
                                %s, nas_identifier
                            ),
                            radius_secret = COALESCE(
                                %s, radius_secret
                            ),
                            driver_type = 'tplink_radius'
                        WHERE id = %s
                          AND tenant_id = %s
                          AND branch_id = %s;
                        """,
                        (
                            new_nas_identifier,
                            new_radius_secret,
                            target_router_id,
                            tenant_id,
                            target_branch_id,
                        ),
                    )

                    if cursor.rowcount != 1:
                        raise HTTPException(
                            status_code=400,
                            detail=(
                                "Could not synchronize the linked "
                                "router's RADIUS configuration."
                            ),
                        )

                await conn.commit()

                return TplinkResponse(
                    message="TP-Link device updated successfully.",
                    tplink_id=updated[0],
                    status=updated[1],
                )

        except HTTPException:
            await conn.rollback()
            raise

        except Exception as exc:
            await conn.rollback()

            raise HTTPException(
                status_code=400,
                detail=f"TP-Link update failed: {str(exc)}",
            )

        finally:
            await conn.close()

    # ============================================================
    # DELETE TP-LINK DEVICE
    # ============================================================

    async def delete_tplink(
        self,
        data: TplinkDelete,
    ) -> TplinkResponse:

        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                await cursor.execute(
                    """
                    DELETE FROM tplink
                    WHERE id = %s
                    RETURNING id;
                    """,
                    (data.tplink_id,),
                )

                row = await cursor.fetchone()

                if not row:
                    raise HTTPException(
                        status_code=404,
                        detail="TP-Link device not found.",
                    )

                # Do not delete or modify the linked router here.
                await conn.commit()

                return TplinkResponse(
                    message="TP-Link device removed successfully.",
                    tplink_id=row[0],
                    status="deleted",
                )

        except HTTPException:
            await conn.rollback()
            raise

        except Exception as exc:
            await conn.rollback()

            raise HTTPException(
                status_code=400,
                detail=f"TP-Link deletion failed: {str(exc)}",
            )

        finally:
            await conn.close()

    # ============================================================
    # LIST TP-LINK DEVICES
    # ============================================================

    async def list_tplink(
        self,
        tenant_id: int,
    ) -> Dict[str, Any]:

        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                await cursor.execute(
                    """
                    SELECT
                        t.id,
                        t.tenant_id,
                        t.branch_id,
                        b.branch_name,
                        t.router_id,
                        r.router_name,
                        r.status AS router_status,
                        t.device_name,
                        t.mac_address,
                        t.ip_address,
                        t.nas_identifier,
                        t.radius_secret,
                        t.portal_url,
                        t.status,
                        t.last_heartbeat_at
                    FROM tplink t
                    LEFT JOIN branches b
                        ON b.id = t.branch_id
                    LEFT JOIN routers r
                        ON r.id = t.router_id
                    WHERE t.tenant_id = %s
                    ORDER BY t.id;
                    """,
                    (tenant_id,),
                )

                rows = await cursor.fetchall()

                columns = [
                    description[0]
                    for description in (cursor.description or [])
                ]

                devices = []

                for row in rows:
                    item = dict(zip(columns, row))

                    # Preserve the existing behavior of exposing
                    # the linked router status when available.
                    if item.get("router_status"):
                        item["status"] = item["router_status"]

                    # Never expose the RADIUS shared secret in
                    # the device listing response.
                    item.pop("radius_secret", None)

                    devices.append(item)

                return {
                    "devices": devices,
                }

        finally:
            await conn.close()

    # ============================================================
    # GET TP-LINK STATUS
    # ============================================================

    async def get_status(
        self,
        tplink_id: int,
    ) -> Dict[str, Any]:

        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                await cursor.execute(
                    """
                    SELECT
                        t.id,
                        t.device_name,
                        COALESCE(
                            r.status,
                            t.status
                        ) AS status,
                        t.last_heartbeat_at
                    FROM tplink t
                    LEFT JOIN routers r
                        ON r.id = t.router_id
                    WHERE t.id = %s;
                    """,
                    (tplink_id,),
                )

                row = await cursor.fetchone()

                if not row:
                    raise HTTPException(
                        status_code=404,
                        detail="TP-Link device not found.",
                    )

                return {
                    "tplink_id": row[0],
                    "device_name": row[1],
                    "status": row[2],
                    "last_heartbeat": (
                        row[3].isoformat()
                        if row[3]
                        else None
                    ),
                }

        finally:
            await conn.close()
