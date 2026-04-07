from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from app.core.database import Base

# Define IST Timezone (UTC + 5:30)
IST = timezone(timedelta(hours=5, minutes=30))

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(IST))
    #We use a lambda function so the time is calculated exactly when the user is created, not when the server starts.


    carts = relationship("Cart", back_populates="user")
    orders = relationship("Order", back_populates="user")


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String)
    price = Column(Float)

    carts = relationship("Cart", back_populates="food")


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    food_id = Column(Integer, ForeignKey("food_items.id"))
    quantity = Column(Integer, default=1)

    user = relationship("User", back_populates="carts")
    food = relationship("FoodItem", back_populates="carts")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_price = Column(Float)
    address = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(IST))

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id")) 
    food_id = Column(Integer, ForeignKey("food_items.id")) 
    
    quantity = Column(Integer, default=1)
    price_at_order = Column(Float) 

    order = relationship("Order", back_populates="items")
    # Added back_populates to keep it consistent if needed later
    food = relationship("FoodItem")
