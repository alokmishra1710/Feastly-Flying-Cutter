from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.schemas import OrderCreate, OrderOut
from app.models.models import Order, OrderItem, Cart, User, FoodItem
from app.core.database import get_db
from app.routers.deps import get_current_user # Dependency we discussed

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderOut)
def create_order(
    order_in: OrderCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch user's cart items
    cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 2. Fetch food items and calculate total server-side (never trust client price)
    total_price = 0.0
    food_map = {}
    for item in cart_items:
        food = db.query(FoodItem).filter(FoodItem.id == item.food_id).first()
        if not food:
            raise HTTPException(status_code=404, detail=f"Food item {item.food_id} no longer exists")
        food_map[item.food_id] = food
        total_price += food.price * item.quantity

    # 3. Create the main Order record
    new_order = Order(
        user_id=current_user.id,
        address=order_in.address,
        total_price=total_price
    )
    db.add(new_order)
    db.flush() # Get new_order.id without committing yet

    # 4. Move items from Cart to OrderItem (to lock in prices/quantities)
    for item in cart_items:
        food = food_map[item.food_id]
        order_item = OrderItem(
            order_id=new_order.id,
            food_id=item.food_id,
            quantity=item.quantity,
            price_at_order=food.price # Capture price at this moment
        )
        db.add(order_item)
        db.delete(item) # Remove from cart

    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/", response_model=list[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Only return orders belonging to the logged-in user
    return db.query(Order).filter(Order.user_id == current_user.id).all()


@router.get("/all", response_model=list[OrderOut])
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns ALL orders from ALL users. Admin only.
    Ordered newest first. Used for the admin dashboard orders tab.
    IMPORTANT: This route must be defined BEFORE any /{order_id} routes
    to prevent FastAPI matching 'all' as a path parameter.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view all orders"
        )
    return db.query(Order).order_by(Order.id.desc()).all()
