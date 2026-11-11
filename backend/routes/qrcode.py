from io import BytesIO
from urllib.parse import urlsplit

import qrcode
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

router = APIRouter()


@router.get("/qrcode")
async def get_qrcode(
    tenant_id: int | None = Query(None),
    portal_url: str = Query(...),
):
    """Generate a QR code image for the requested captive portal URL."""
    parsed_url = urlsplit(portal_url)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        raise HTTPException(status_code=400, detail="A valid HTTP(S) portal URL is required.")

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(portal_url)
    qr.make(fit=True)

    image = qr.make_image(fill_color="black", back_color="white")
    image_data = BytesIO()
    image.save(image_data, format="PNG")

    return Response(
        content=image_data.getvalue(),
        media_type="image/png",
        headers={
            "Cache-Control": "no-store",
            "X-Portal-Url": portal_url,
            "X-Tenant-Id": str(tenant_id) if tenant_id else "",
        },
    )
