from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.schemas import FoodCreate, FoodOut, FoodUpdate
from app.models.models import FoodItem, User
from app.core.database import get_db
from app.routers.deps import get_current_user

router = APIRouter(prefix="/food", tags=["Food"])

@router.post("/", response_model=FoodOut)
def create_food(food: FoodCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create food items."
        )
    item = FoodItem(**food.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/", response_model=list[FoodOut])
def get_food(db: Session = Depends(get_db)):
    return db.query(FoodItem).all()

@router.patch("/{food_id}", response_model=FoodOut)
def update_food(
    food_id: int,
    food_in: FoodUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Partially update a food item. Admin only.
    Only fields that are provided (not None) are updated — true PATCH semantics.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only.")

    item = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")

    # Only update the fields that were actually sent in the request
    update_data = food_in.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{food_id}", status_code=204)
def delete_food(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a food item from the menu. Admin only.
    Returns 204 No Content on success.
    Note: existing OrderItems that reference this food_id are preserved
    (they already captured price_at_order, so historical orders remain accurate).
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only.")

    item = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")

    db.delete(item)
    db.commit()