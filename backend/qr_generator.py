"""Helpers to generate portal QR codes."""

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import SolidFillColorMask
from qrcode.image.styles.moduledrawers import SquareModuleDrawer
from pathlib import Path
from typing import Optional


def generate_portal_qr(
    portal_url: str,
    output_path: str,
    box_size: int = 10,
    border: int = 4,
    fill_color: str = "#000000",
    back_color: str = "#FFFFFF",
    logo_path: Optional[str] = None,
) -> str:
    """
    Generate a QR code image for the NetKitonga captive portal.

    Args:
        portal_url: The portal URL to encode (e.g. https://netkitonga.com/portal).
        output_path: Where to save the generated PNG image.
        box_size: Size of each QR code module.
        border: Border size (modules).
        fill_color: QR code foreground color.
        back_color: QR code background color.
        logo_path: Optional logo image to embed in the center.

    Returns:
        The absolute path to the generated QR code image.
    """
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(portal_url)
    qr.make(fit=True)

    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=SquareModuleDrawer(),
        color_mask=SolidFillColorMask(
            front_color=fill_color,
            back_color=back_color,
        ),
    )

    if logo_path:
        try:
            from PIL import Image

            logo = Image.open(logo_path)
            logo = logo.convert("RGBA")
            qr_w, qr_h = img.size
            factor = 4
            logo_size = qr_w // factor
            logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
            pos = ((qr_w - logo_size) // 2, (qr_h - logo_size) // 2)
            img.paste(logo, pos, logo)
        except Exception:
            pass

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)
    return str(out_path)


def generate_portal_qr_svg(
    portal_url: str,
    output_path: str,
    box_size: int = 10,
    border: int = 4,
    fill_color: str = "#000000",
    back_color: str = "#FFFFFF",
) -> str:
    """
    Generate an SVG QR code for the NetKitonga captive portal.

    Returns:
        The absolute path to the generated SVG file.
    """
    factory = qrcode.image.svg.SvgPathImage
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
        image_factory=factory,
    )
    qr.add_data(portal_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color=fill_color, back_color=back_color)

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)
    return str(out_path)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python qrcode.py <portal_url> [output_path]")
        sys.exit(1)

    url = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else "portal_qr.png"
    print(generate_portal_qr(url, out))
