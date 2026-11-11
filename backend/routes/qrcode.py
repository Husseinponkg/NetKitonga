from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io

router = APIRouter()


def _build_portal_url(tenant_id: int | None, base: str | None = None) -> str:
    if base is None:
        base = "https://netkitonga.com/portal"
    if tenant_id:
        return f"{base}/{tenant_id}"
    return base


def _generate_qr_png(url: str) -> bytes:
    try:
        import qrcode
        from qrcode.image.pil import PilImage
    except Exception:
        # Fallback: simple SVG as PNG is not possible without qrcode lib
        raise RuntimeError("qrcode library not installed")

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(image_factory=PilImage, fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


@router.get("/qrcode")
async def get_qrcode(
    tenant_id: int | None = Query(None),
    url: str | None = Query(None),
):
    """Generate a QR code image for the NetKitonga captive portal.

    If `tenant_id` is provided, encodes `https://netkitonga.com/portal/<tenant_id>`.
    Otherwise encodes the `url` query param or the default portal URL.
    """
    portal_url = url or _build_portal_url(tenant_id)

    try:
        png_bytes = _generate_qr_png(portal_url)
    except Exception as exc:
        return {"error": f"QR code generation failed: {str(exc)}"}

    return StreamingResponse(
        iter([png_bytes]),
        media_type="image/png",
        headers={
            "Content-Disposition": f'inline; filename="qrcode-tenant-{tenant_id or "general"}.png"',
        },
    )
