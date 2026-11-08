import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.freeradius import FreeRADIUSService


def make_connection(cursor):
    cursor_context = MagicMock()
    cursor_context.__aenter__ = AsyncMock(return_value=cursor)
    cursor_context.__aexit__ = AsyncMock(return_value=False)

    conn = MagicMock()
    conn.cursor.return_value = cursor_context
    conn.close = AsyncMock()
    conn.commit = AsyncMock()
    return conn


class FreeRadiusHeartbeatTests(unittest.IsolatedAsyncioTestCase):
    async def test_ap_mac_nas_identifier_marks_tplink_router_online(self):
        lookup_cursor = AsyncMock()
        lookup_cursor.fetchone.return_value = None
        lookup_cursor.fetchall.return_value = [(15,)]
        update_cursor = AsyncMock()

        with (
            patch(
                "services.freeradius.connection",
                new=AsyncMock(
                    side_effect=[
                        make_connection(lookup_cursor),
                        make_connection(update_cursor),
                    ]
                ),
            ),
            patch.object(
                FreeRADIUSService,
                "get_active_session_for_mac",
                new=AsyncMock(return_value=None),
            ),
        ):
            result = await FreeRADIUSService().authenticate(
                username="AA:BB:CC:DD:EE:FF",
                password="unused",
                nas_identifier="10-5A-95-51-D4-E4",
            )

        self.assertEqual(result["control:Auth-Type"], "Reject")
        self.assertIn("mac_address", lookup_cursor.execute.await_args.args[0])
        self.assertEqual(
            lookup_cursor.execute.await_args.args[1],
            ("105A9551D4E4",),
        )
        self.assertEqual(update_cursor.execute.await_count, 2)

    def test_clients_config_includes_tplink_with_generic_nas_type(self):
        config = FreeRADIUSService.build_clients_config(
            [
                {
                    "router_name": "tplink",
                    "ip_address": "197.186.65.217",
                    "nas_identifier": "10-5A-95-51-D4-E4",
                    "radius_secret": "configured-secret",
                    "driver_type": "tplink_radius",
                }
            ]
        )

        self.assertIn("client tplink", config)
        self.assertIn("nas_type = other", config)


if __name__ == "__main__":
    unittest.main()
