from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from app.schemas.schemas import UserCreate, UserLogin, UserOut, Token, ForgotPassword  # Added Token
from app.models.models import User
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.services.recaptcha import verify_recaptcha
from fastapi.security import OAuth2PasswordRequestForm



#APIRouter -> It groups related APIs together 
#prefic -> every api in this file will start with /auth (eg. /auth/signup)
#tags -> mainly for swagger up - It groups APIs under a section called authentication
router = APIRouter(prefix="/auth", tags=["Authentication"]) 
                                                            
                                                            
@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    if not await verify_recaptcha(user_in.recaptcha_token):
        raise HTTPException(status_code=400, detail="Invalid reCAPTCHA")

    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already registered")

    user_data = user_in.model_dump(exclude={"recaptcha_token", "password"})
    hashed_pwd = hash_password(user_in.password)
    
    # New users are False (Admin) by default because of your Model definition
    new_user = User(**user_data, password=hashed_pwd)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(
    user_credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    recaptcha_token: str = Form(default="dev-bypass")
):
    if not await verify_recaptcha(recaptcha_token):
        raise HTTPException(status_code=400, detail="Invalid reCAPTCHA")

    db_user = db.query(User).filter(User.email == user_credentials.username).first()

    # 2. Validate password
    if not db_user or not verify_password(user_credentials.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )

    # 3. Generate JWT Token
    token = create_access_token(data={"sub": str(db_user.id)})

    # 4. Return everything the frontend needs to handle UI logic
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": db_user.email,
            "id": db_user.id,
            "is_admin": db_user.is_admin # <--- Frontend now knows the role!
        }
    }


@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    """Allows a user to reset their own password by verifying their email + reCAPTCHA."""
    if not await verify_recaptcha(data.recaptcha_token):
        raise HTTPException(status_code=400, detail="Invalid reCAPTCHA")

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password reset successfully"}
