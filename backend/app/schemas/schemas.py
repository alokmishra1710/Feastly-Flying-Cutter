from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    recaptcha_token: str

class UserLogin(UserBase):
    password: str
    recaptcha_token: str

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PasswordReset(BaseModel):
    new_password: str

class PasswordChange(BaseModel):          # ← NEW: for user self-service password change
    current_password: str
    new_password: str

# --- FOOD ITEM SCHEMAS ---
class FoodBase(BaseModel):
    name: str
    description: str
    price: float

class FoodCreate(FoodBase):
    pass

class FoodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None   # ← NEW

class FoodOut(FoodBase):
    id: int
    is_available: bool = True             # ← NEW

    class Config:
        from_attributes = True

# --- CART SCHEMAS ---
class CartBase(BaseModel):
    food_id: int
    quantity: int

class CartCreate(CartBase):
    pass

class CartUpdate(BaseModel):              # ← NEW: for quantity update
    quantity: int

class CartOut(CartBase):
    id: int
    user_id: int
    food: Optional[FoodOut] = None

    class Config:
        from_attributes = True

# --- ORDER ITEM SCHEMAS ---
class OrderItemOut(BaseModel):
    id: int
    food_id: int
    food_name: Optional[str] = None       # ← NEW: food name at order time
    quantity: int
    price_at_order: float

    class Config:
        from_attributes = True

# --- ORDER SCHEMAS ---
class OrderBase(BaseModel):
    address: str

class OrderCreate(OrderBase):
    pass

class OrderOut(OrderBase):
    id: int
    user_id: Optional[int] = None
    total_price: float
    status: str = "pending"
    created_at: datetime
    items: List[OrderItemOut] = []
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class UserLoginResponse(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserLoginResponse