import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.routers import RouterService


class RouterIpResolutionTests(unittest.TestCase):
    def test_hotspot_client_ip_falls_back_to_gateway_ip(self):
        service = RouterService()
        candidates = service.get_router_ip_candidates("10.10.10.42")
        self.assertIn("10.10.10.42", candidates)
        self.assertIn("10.10.10.1", candidates)

    def test_router_ip_is_preserved_when_it_is_already_the_gateway(self):
        service = RouterService()
        candidates = service.get_router_ip_candidates("10.10.10.1")
        self.assertEqual(candidates, ["10.10.10.1"])


if __name__ == "__main__":
    unittest.main()
