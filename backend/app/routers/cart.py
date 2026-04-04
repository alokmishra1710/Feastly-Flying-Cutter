from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.schemas import CartCreate, CartOut
from app.models.models import Cart, User # Import User model
from app.core.database import get_db
from app.routers.deps import get_current_user # This is the dependency we'll build

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.post("/", response_model=CartOut)
def add_to_cart(
    cart_in: CartCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Check if this food item is already in the user's cart
    existing = db.query(Cart).filter(
        Cart.user_id == current_user.id,
        Cart.food_id == cart_in.food_id
    ).first()

    if existing:
        # Update quantity instead of creating a duplicate row
        existing.quantity += cart_in.quantity
        db.commit()
        db.refresh(existing)
        return existing

    # Use the ID from the token, not from the request body/URL
    item = Cart(**cart_in.model_dump(), user_id=current_user.id) 
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/", response_model=list[CartOut])
def get_cart(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Only returns items belonging to the logged-in user
    return db.query(Cart).filter(Cart.user_id == current_user.id).all()


@router.delete("/{cart_id}", status_code=204)
def remove_from_cart(
    cart_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Removes a single item from the current user's cart by cart row ID.
    Users can only delete their own cart items — they cannot touch other users' carts.
    Returns 204 No Content on success.
    """
    # Fetch the cart item
    cart_item = db.query(Cart).filter(Cart.id == cart_id).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Security: ensure this cart item belongs to the logged-in user
    # Without this check, any authenticated user could delete anyone's cart item
    if cart_item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to remove this item"
        )

    db.delete(cart_item)
    db.commit()
    # 204 No Content — return nothing
