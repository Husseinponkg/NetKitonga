import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.tplink import TplinkController


class TplinkPortalResolutionTests(unittest.IsolatedAsyncioTestCase):
    async def test_resolves_portal_by_ap_mac(self):
        cursor = AsyncMock()
        cursor.fetchone.return_value = (
            15,
            2,
            2,
            "197.186.65.217",
            "tplink",
        )
        cursor_context = MagicMock()
        cursor_context.__aenter__ = AsyncMock(return_value=cursor)
        cursor_context.__aexit__ = AsyncMock(return_value=False)

        conn = MagicMock()
        conn.cursor.return_value = cursor_context
        conn.close = AsyncMock()

        with patch(
            "controllers.tplink.connection",
            new=AsyncMock(return_value=conn),
        ):
            result = await TplinkController().resolve_portal_device(
                ap_mac="aa-bb-cc-dd-ee-ff",
            )

        self.assertEqual(result["router_id"], 15)
        self.assertEqual(result["tenant_id"], 2)
        self.assertEqual(result["driver_type"], "tplink_radius")
        cursor.execute.assert_awaited_once()
        self.assertIn("FROM routers r", cursor.execute.await_args.args[0])
        self.assertEqual(cursor.execute.await_args.args[1], ("AABBCCDDEEFF",))

    async def test_resolves_from_tplink_registry_when_router_mac_does_not_match(self):
        cursor = AsyncMock()
        cursor.fetchone.side_effect = [
            None,
            (
                12,
                4,
                2,
                "192.168.1.20",
                "Lobby router",
            ),
        ]
        cursor_context = MagicMock()
        cursor_context.__aenter__ = AsyncMock(return_value=cursor)
        cursor_context.__aexit__ = AsyncMock(return_value=False)

        conn = MagicMock()
        conn.cursor.return_value = cursor_context
        conn.close = AsyncMock()

        with patch(
            "controllers.tplink.connection",
            new=AsyncMock(return_value=conn),
        ):
            result = await TplinkController().resolve_portal_device(
                ap_mac="aa-bb-cc-dd-ee-ff",
            )

        self.assertEqual(result["router_id"], 12)
        self.assertEqual(cursor.execute.await_count, 2)
        self.assertIn("FROM tplink t", cursor.execute.await_args.args[0])


if __name__ == "__main__":
    unittest.main()
