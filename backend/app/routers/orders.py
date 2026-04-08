from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.schemas.schemas import OrderCreate, OrderOut
from app.models.models import Order, OrderItem, Cart, User, FoodItem
from app.core.database import get_db
from app.routers.deps import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderOut)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total_price = 0.0
    food_map = {}
    for item in cart_items:
        food = db.query(FoodItem).filter(FoodItem.id == item.food_id).first()
        if not food:
            raise HTTPException(status_code=404, detail=f"Food item {item.food_id} no longer exists")
        if not food.is_available:
            raise HTTPException(status_code=400, detail=f"{food.name} is currently unavailable")
        food_map[item.food_id] = food
        total_price += food.price * item.quantity

    new_order = Order(
        user_id=current_user.id,
        address=order_in.address,
        total_price=total_price
    )
    db.add(new_order)
    db.flush()

    for item in cart_items:
        food = food_map[item.food_id]
        order_item = OrderItem(
            order_id=new_order.id,
            food_id=item.food_id,
            food_name=food.name,           # ← capture name at order time
            quantity=item.quantity,
            price_at_order=food.price
        )
        db.add(order_item)
        db.delete(item)

    db.commit()
    db.refresh(new_order)
    return new_order


@router.get("/", response_model=list[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.id.desc()).all()


@router.get("/all", response_model=list[OrderOut])
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can view all orders")
    return db.query(Order).order_by(Order.id.desc()).all()


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: str = Body(..., embed=True)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins only.")

    valid = {"pending", "preparing", "out_for_delivery", "delivered"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status
    db.commit()
    db.refresh(order)
    return {"message": f"Order #{order_id} status updated to {status}"}


@router.patch("/{order_id}/cancel")   # ← NEW: user cancels their own pending order
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Users can only cancel their own orders
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own orders")

    # Can only cancel if still pending
    if order.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order — it is already '{order.status}'"
        )
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return {"message": f"Order #{order_id} cancelled successfully"}