import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from routes import radius as radius_route
from services.freeradius import FreeRADIUSService


def make_connection(cursor):
    cursor_context = MagicMock()
    cursor_context.__aenter__ = AsyncMock(return_value=cursor)
    cursor_context.__aexit__ = AsyncMock(return_value=False)

    conn = MagicMock()
    conn.cursor.return_value = cursor_context
    conn.close = AsyncMock()
    return conn


class FreeRadiusClientConfigTests(unittest.IsolatedAsyncioTestCase):
    async def test_active_session_lookup_excludes_tplink_omada(self):
        cursor = AsyncMock()
        cursor.fetchone.return_value = None
        conn = make_connection(cursor)

        with (
            patch(
                "services.freeradius.connection",
                new=AsyncMock(return_value=conn),
            ),
        ):
            await FreeRADIUSService().get_active_session_for_mac(
                tenant_id=None,
                mac_address="AA:BB:CC:DD:EE:FF",
            )

        query = cursor.execute.await_args.args[0]
        self.assertIn(
            "r.driver_type IN ('mikrotik_radius', 'radius_aaa')",
            query,
        )
        conn.close.assert_awaited_once()

    async def test_clients_config_excludes_tplink_omada_devices(self):
        cursor = AsyncMock()
        cursor.fetchall.return_value = [
            (
                "MikroTik",
                "197.186.65.217",
                "mikrotik-01",
                "configured-secret",
                "mikrotik_radius",
            )
        ]
        conn = make_connection(cursor)

        with patch(
            "routes.radius.connection",
            new=AsyncMock(return_value=conn),
        ):
            result = await radius_route.get_freeradius_clients(tenant_id=2)

        query = cursor.execute.await_args.args[0]
        self.assertIn("driver_type IN ('mikrotik_radius', 'radius_aaa')", query)
        self.assertNotIn("'tplink_radius'", query)
        self.assertIn("ipaddr = 197.186.65.217", result["config"])
        conn.close.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
