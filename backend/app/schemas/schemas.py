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
        from_attributes = True  # Allows Pydantic to read SQLAlchemy models


# --- FOOD ITEM SCHEMAS ---
class FoodBase(BaseModel):
    name: str
    description: str
    price: float

class FoodCreate(FoodBase):
    pass

class FoodUpdate(BaseModel):
    """All fields optional — only send what you want to change (PATCH semantics)."""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None

class FoodOut(FoodBase):
    id: int

    class Config:
        from_attributes = True


# --- CART SCHEMAS ---
class CartBase(BaseModel):
    food_id: int
    quantity: int

class CartCreate(CartBase):
    pass

class CartOut(CartBase):
    id: int
    user_id: int
    # This nested schema lets you see food details inside the cart
    food: Optional[FoodOut] = None 

    class Config:
        from_attributes = True



#--------ORDER ITEM SCHEMAS-------
class OrderItemOut(BaseModel):
    id: int
    food_id: int
    quantity: int
    price_at_order: float
    # Optional: food: FoodOut (to show the name/description)

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
    created_at: datetime
    items: List[OrderItemOut] = []
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class UserLoginResponse(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool  # This tells the frontend if the user is an Admin

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserLoginResponse # Returns user details with the token
