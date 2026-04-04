import httpx
from app.core.config import settings

async def verify_recaptcha(token: str):
    # Bypass reCAPTCHA only if DISABLE_RECAPTCHA=true is set in .env
    if settings.DISABLE_RECAPTCHA:
        return True

    if not token:  # Quick fail if token is empty
        return False

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={
                "secret": settings.RECAPTCHA_SECRET,
                "response": token
            }
        )
        data = response.json()
        return data.get("success", False)