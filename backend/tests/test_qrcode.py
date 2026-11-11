import unittest
from io import BytesIO

from fastapi import FastAPI
from fastapi.routing import APIRoute
from PIL import Image

from backend.routes.qrcode import QR_API_PREFIX, get_qrcode, router


class QrCodeRouteTests(unittest.IsolatedAsyncioTestCase):
    async def _read_image_response(self, response):
        return b"".join([chunk async for chunk in response.body_iterator])

    def test_route_is_mounted_at_the_path_requested_by_the_frontend(self):
        app = FastAPI()
        app.include_router(router, prefix=QR_API_PREFIX)
        paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

        self.assertIn("/qrcode/qrcode", paths)

    async def test_generates_tenant_qr_code_as_png(self):
        response = await get_qrcode(tenant_id=42, url=None)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/png")
        self.assertEqual(response.headers["x-portal-url"], "https://netkitonga.com/portal/42")
        Image.open(BytesIO(await self._read_image_response(response))).verify()

    async def test_generates_general_portal_qr_code_as_png(self):
        response = await get_qrcode(tenant_id=None, url=None)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["x-portal-url"], "https://netkitonga.com/portal")
        Image.open(BytesIO(await self._read_image_response(response))).verify()


if __name__ == "__main__":
    unittest.main()
