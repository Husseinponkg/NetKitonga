from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

BACKEND_DIR = Path(__file__).resolve().parent
QR_IMAGE_PATH = BACKEND_DIR / "qrcode.jpeg"


@router.get("/qrcode")
async def get_qrcode():
    """Serve the NetKitonga captive portal QR code image."""
    if not QR_IMAGE_PATH.exists():
        return FileResponse(
            path=str(QR_IMAGE_PATH),
            media_type="image/jpeg",
            filename="qrcode.jpeg",
        )
    return FileResponse(path=str(QR_IMAGE_PATH), media_type="image/jpeg", filename="qrcode.jpeg")
