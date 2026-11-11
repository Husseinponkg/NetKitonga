from fastapi import APIRouter, Query
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

BACKEND_DIR = Path(__file__).resolve().parent
QR_IMAGE_PATH = BACKEND_DIR / "qrcode.jpeg"


@router.get("/qrcode")
async def get_qrcode(
    tenant_id: int | None = Query(None),
):
    """Serve the NetKitonga captive portal QR code image.

    If `tenant_id` is provided, it's included in the response metadata
    so the frontend can display which tenant the QR code belongs to.
    """
    if not QR_IMAGE_PATH.exists():
        return {"error": "QR code image not found on server."}

    return FileResponse(
        path=str(QR_IMAGE_PATH),
        media_type="image/jpeg",
        filename="qrcode.jpeg",
        headers={
            "X-Portal-Url": f"https://netkitonga.com/portal/{tenant_id}" if tenant_id else "https://netkitonga.com/portal",
            "X-Tenant-Id": str(tenant_id) if tenant_id else "",
        },
    )
