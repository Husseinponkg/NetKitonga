
import logging
import asyncio
import ipaddress
import shutil
from typing import Dict, Any, Optional

from fastapi import HTTPException

from config.db import connection
from models.tplink import (
    TplinkRegister,
    TplinkUpdate,
    TplinkDelete,
    TplinkResponse,
    TplinkAuthorizeRequest,
)
from services.omada import (
    OmadaConfigurationError,
    OmadaControllerError,
    OmadaService,
)
from services.tplink import TplinkService
from utils.mac import normalize_mac

logger = logging.getLogger(__name__)


class TplinkController:

    def __init__(self):
        self.tplink_service = TplinkService()
        self.omada_service = OmadaService()

    async def authorize_portal_client(
        self,
        data: TplinkAuthorizeRequest,
    ) -> Dict[str, Any]:
        client_mac = normalize_mac(data.buyer_mac).replace(":", "")
        if len(client_mac) != 12:
            raise HTTPException(
                status_code=400,
                detail="The Omada client MAC address is invalid.",
            )

        ap_mac = normalize_mac(data.ap_mac).replace(":", "")
        if len(ap_mac) != 12:
            raise HTTPException(
                status_code=400,
                detail="The Omada access point MAC address is invalid.",
            )

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT s.session_id,
                           GREATEST(
                               0,
                               FLOOR(
                                   EXTRACT(EPOCH FROM (s.expiration_time - NOW()))
                                   * 1000
                               )
                           )::bigint
                    FROM payments p
                    JOIN buyers b
                      ON b.id = p.buyer_id
                     AND b.tenant_id = p.tenant_id
                    JOIN active_sessions s
                      ON s.payment_id = p.id
                     AND s.router_id = p.router_id
                     AND s.buyer_id = p.buyer_id
                    JOIN routers r
                      ON r.id = p.router_id
                    WHERE p.router_id = %s
                      AND p.auth_token = %s
                      AND p.status = 'completed'
                      AND s.status = 'active'
                      AND s.expiration_time > NOW()
                      AND r.driver_type = 'tplink_radius'
                      AND regexp_replace(
                            upper(coalesce(b.buyer_mac, '')),
                            '[^0-9A-F]',
                            '',
                            'g'
                          ) = %s
                    ORDER BY s.expiration_time DESC
                    LIMIT 1;
                    """,
                    (data.router_id, data.auth_token, client_mac),
                )
                session = await cursor.fetchone()
                if session and session[1] > 0:
                    await cursor.execute(
                        """
                        INSERT INTO omada_client_sessions (
                            session_id, client_mac, site, ssid_name
                        ) VALUES (%s, %s, %s, %s)
                        ON CONFLICT (session_id) DO UPDATE SET
                            client_mac = EXCLUDED.client_mac,
                            site = EXCLUDED.site,
                            ssid_name = EXCLUDED.ssid_name;
                        """,
                        (
                            session[0],
                            normalize_mac(data.buyer_mac),
                            data.site,
                            data.ssid_name,
                        ),
                    )
                    await conn.commit()
        finally:
            await conn.close()

        if not session or not session[1] or session[1] <= 0:
            raise HTTPException(
                status_code=403,
                detail="No active paid or voucher session matches this client and router.",
            )

        try:
            await asyncio.to_thread(
                self.omada_service.authorize_client,
                data,
                session[1],
            )
        except OmadaConfigurationError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except OmadaControllerError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT 1
                    FROM active_sessions
                    WHERE session_id = %s
                      AND status = 'active'
                      AND expiration_time > NOW();
                    """,
                    (session[0],),
                )
                still_active = await cursor.fetchone()
        finally:
            await conn.close()

        if not still_active:
            try:
                await asyncio.to_thread(
                    self.omada_service.deauthorize_client,
                    normalize_mac(data.buyer_mac),
                    data.site,
                    data.ssid_name,
                )
            except OmadaConfigurationError as exc:
                raise HTTPException(
                    status_code=503,
                    detail=(
                        "The session is no longer active, but Omada access "
                        f"could not be revoked: {exc}"
                    ),
                ) from exc
            except OmadaControllerError as exc:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        "The session is no longer active, but Omada access "
                        f"could not be revoked: {exc}"
                    ),
                ) from exc
            raise HTTPException(
                status_code=403,
                detail="The paid session expired or was terminated during authorization.",
            )

        return {"authorized": True}

    async def resolve_portal_device(
        self,
        ip_address: Optional[str] = None,
        ap_mac: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Resolve an Omada portal redirect by AP MAC or target IP."""
        target_ip = None
        if ip_address:
            try:
                target_ip = str(ipaddress.ip_address(ip_address))
            except ValueError:
                if not ap_mac:
                    raise HTTPException(
                        status_code=400,
                        detail="The TP-Link portal target must be an IP address.",
                    )

        normalized_ap_mac = normalize_mac(ap_mac) if ap_mac else ""
        compact_ap_mac = normalized_ap_mac.replace(":", "")
        if ap_mac and len(compact_ap_mac) != 12:
            if not target_ip:
                raise HTTPException(
                    status_code=400,
                    detail="The TP-Link portal AP MAC address is invalid.",
                )
            compact_ap_mac = ""

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                device = None

                if compact_ap_mac:
                    await cursor.execute(
                        """
                        SELECT
                            r.id,
                            r.tenant_id,
                            r.branch_id,
                            r.ip_address,
                            r.router_name
                        FROM routers r
                        WHERE REPLACE(
                            REPLACE(
                                REPLACE(UPPER(TRIM(r.mac_address)), '-', ''),
                                ':',
                                ''
                            ),
                            '.',
                            ''
                        ) = %s
                          AND r.driver_type = 'tplink_radius'
                        ORDER BY r.id
                        LIMIT 1;
                        """,
                        (compact_ap_mac,),
                    )
                    device = await cursor.fetchone()

                if not device and target_ip:
                    await cursor.execute(
                        """
                        SELECT
                            r.id,
                            r.tenant_id,
                            r.branch_id,
                            r.ip_address,
                            r.router_name
                        FROM routers r
                        WHERE host(r.ip_address) = host(%s::inet)
                          AND r.driver_type = 'tplink_radius'
                        ORDER BY r.id
                        LIMIT 1;
                        """,
                        (target_ip,),
                    )
                    device = await cursor.fetchone()

                if not device and compact_ap_mac:
                    await cursor.execute(
                        """
                        SELECT
                            t.router_id,
                            t.tenant_id,
                            t.branch_id,
                            t.ip_address,
                            r.router_name
                        FROM tplink t
                        JOIN routers r ON r.id = t.router_id
                        WHERE REPLACE(
                            REPLACE(
                                REPLACE(UPPER(TRIM(t.mac_address)), '-', ''),
                                ':',
                                ''
                            ),
                            '.',
                            ''
                        ) = %s
                          AND t.tenant_id = r.tenant_id
                        ORDER BY t.id
                        LIMIT 1;
                        """,
                        (compact_ap_mac,),
                    )
                    device = await cursor.fetchone()

                if not device and target_ip:
                    await cursor.execute(
                        """
                        SELECT
                            t.router_id,
                            t.tenant_id,
                            t.branch_id,
                            t.ip_address,
                            r.router_name
                        FROM tplink t
                        JOIN routers r ON r.id = t.router_id
                        WHERE host(t.ip_address) = host(%s::inet)
                          AND t.tenant_id = r.tenant_id
                        ORDER BY t.id
                        LIMIT 1;
                        """,
                        (target_ip,),
                    )
                    device = await cursor.fetchone()

                if not device:
                    raise HTTPException(
                        status_code=404,
                        detail="No registered TP-Link device matches this portal AP MAC or target.",
                    )

                return {
                    "router_id": device[0],
                    "tenant_id": device[1],
                    "branch_id": device[2],
                    "router_ip": str(device[3]) if device[3] else None,
                    "router_name": device[4],
                    "driver_type": "tplink_radius",
                }
        except HTTPException:
            raise
        except Exception:
            logger.exception("TP-Link portal device lookup failed.")
            raise
        finally:
            await conn.close()

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
                        portal_url,
                        status,
                        last_heartbeat_at
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s
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

                await cursor.execute(
                    """
                    UPDATE routers
                    SET
                        nas_identifier = NULL,
                        radius_secret = NULL,
                        radius_client_ip = NULL,
                        driver_type = 'tplink_radius'
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
                        router_id
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
                    tenant_id,
                    current_branch_id,
                    current_router_id,
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
                        nas_identifier = NULL,
                        radius_secret = NULL,
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

                if data.router_id is not None or data.branch_id is not None:
                    await cursor.execute(
                        """
                        UPDATE routers
                        SET
                            nas_identifier = NULL,
                            radius_secret = NULL,
                            radius_client_ip = NULL,
                            nas_identifier = NULL,
                            radius_secret = NULL,
                            radius_client_ip = NULL,
                            driver_type = 'tplink_radius'
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

                    if cursor.rowcount != 1:
                        raise HTTPException(
                            status_code=400,
                            detail=(
                                "Could not synchronize the linked "
                                "router's Omada portal configuration."
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

                    devices.append(item)

                return {
                    "devices": devices,
                }

        finally:
            await conn.close()

    # ============================================================
    # PROCESS TP-LINK HEARTBEAT
    # ============================================================

    async def process_heartbeat(self, tplink_id: int) -> Dict[str, Any]:
        """Ping a registered AP and persist online status only when reachable."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT id, router_id, ip_address, device_name
                    FROM tplink
                    WHERE id = %s;
                    """,
                    (tplink_id,),
                )
                device = await cursor.fetchone()

                if not device:
                    raise HTTPException(
                        status_code=404,
                        detail="TP-Link device not found.",
                    )

                device_id, linked_router_id, ip_address, device_name = device

            reachable = await self._ping_ip(str(ip_address)) if ip_address else False
            status_value = "online" if reachable else "offline"

            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    UPDATE tplink
                    SET
                        status = %s,
                        last_heartbeat_at = CASE
                            WHEN %s THEN CURRENT_TIMESTAMP
                            ELSE last_heartbeat_at
                        END
                    WHERE id = %s
                    RETURNING last_heartbeat_at;
                    """,
                    (status_value, reachable, device_id),
                )
                heartbeat = await cursor.fetchone()

                if linked_router_id is not None:
                    await cursor.execute(
                        """
                        UPDATE routers
                        SET
                            status = %s,
                            last_heartbeat_at = CASE
                                WHEN %s THEN CURRENT_TIMESTAMP
                                ELSE last_heartbeat_at
                            END
                        WHERE id = %s AND driver_type = 'tplink_radius';
                        """,
                        (status_value, reachable, linked_router_id),
                    )

                await conn.commit()
                return {
                    "message": (
                        "TP-Link AP responded to ping."
                        if reachable
                        else "TP-Link AP did not respond to ping."
                    ),
                    "tplink_id": device_id,
                    "router_id": linked_router_id,
                    "device_name": device_name,
                    "ip_address": str(ip_address) if ip_address else None,
                    "reachable": reachable,
                    "status": status_value,
                    "last_heartbeat": heartbeat[0].isoformat() if heartbeat and heartbeat[0] else None,
                }

        except HTTPException:
            await conn.rollback()
            raise
        except Exception as exc:
            await conn.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to record TP-Link heartbeat: {str(exc)}",
            )
        finally:
            await conn.close()

    @staticmethod
    async def _ping_ip(ip_address: str) -> bool:
        """Send one bounded ICMP echo to a registered device address."""
        try:
            target = ipaddress.ip_address(ip_address)
        except ValueError:
            return False

        ping_command = shutil.which("ping")
        if not ping_command:
            raise HTTPException(
                status_code=503,
                detail="The backend server does not have the ping utility installed.",
            )

        command = [ping_command, "-n", "-c", "1", "-W", "2"]
        if target.version == 6:
            command.insert(1, "-6")
        command.append(str(target))

        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
        except OSError as exc:
            logger.exception("Could not start ping for TP-Link IP %s.", target)
            raise HTTPException(
                status_code=503,
                detail="The backend could not start the ping utility.",
            ) from exc

        try:
            await asyncio.wait_for(process.communicate(), timeout=3)
        except asyncio.TimeoutError:
            try:
                process.kill()
            except ProcessLookupError:
                pass
            await process.wait()
            return False

        return process.returncode == 0

    # ============================================================
    # GET TP-LINK STATUS
    # ============================================================

    async def get_status(
        self,
        tplink_id: int,
    ) -> Dict[str, Any]:
        return await self.process_heartbeat(tplink_id)
