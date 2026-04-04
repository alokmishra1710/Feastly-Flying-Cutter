from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.schemas import UserOut, UserCreate
from app.models.models import User
from app.core.database import get_db
from app.core.security import hash_password
from app.routers.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserOut)
def admin_create_user(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Allows an Admin to manually create a new user account.
    Requires a valid Admin JWT token.
    """
    # 1. Security Check: Only Admins can manually create users here
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can manually create users")

    # 2. Check if email exists
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 3. Create the user using model_dump (cleaner approach)
    user_data = user_in.model_dump(exclude={"password", "recaptcha_token"})
    hashed_pwd = hash_password(user_in.password)
    
    new_user = User(**user_data, password=hashed_pwd)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/", response_model=list[UserOut])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns a list of all registered users. Admin only."""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view user list")
    
    return db.query(User).all()


@router.patch("/{user_id}/toggle-admin")
def toggle_user_admin(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Promotes a user to Admin or demotes them to a regular User."""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can manage roles")

    user_to_update = db.query(User).filter(User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    # Toggle the boolean value
    user_to_update.is_admin = not user_to_update.is_admin
    db.commit()
    db.refresh(user_to_update)
    
    return {
        "message": f"User {user_to_update.email} admin status updated to {user_to_update.is_admin}"
    }


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a user account along with all their cart items.
    Rules:
      - A regular user can only delete their OWN account.
      - An admin can delete any account EXCEPT their own
        (prevents accidental self-lockout of the last admin).
    Returns 204 No Content on success.
    """
    # Prevent admin from accidentally deleting themselves
    if current_user.id == user_id and current_user.is_admin:
        raise HTTPException(
            status_code=400,
            detail="Admins cannot delete their own account. Transfer admin rights first."
        )

    # Regular users can only delete themselves
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own account"
        )

    # Find the target user
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    # Cascade delete: remove cart items first to avoid FK constraint errors
    # (Orders are preserved for record-keeping — they already captured price_at_order)
    from app.models.models import Cart as CartModel
    db.query(CartModel).filter(CartModel.user_id == user_id).delete()

    db.delete(user_to_delete)
    db.commit()
    # 204 No Content — return nothing
