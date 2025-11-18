from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_id

from . import schemas, service

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=schemas.CartResponse)
def get_cart(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.CartResponse:
    items = service.get_cart_items(db=db, user_id=user_id)
    return schemas.CartResponse(items=items)


@router.post("", response_model=schemas.CartItemWrapper)
def add_cart_item(
    payload: schemas.AddToCartRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.CartItemWrapper:
    item = service.add_to_cart(db=db, user_id=user_id, payload=payload)
    return schemas.CartItemWrapper(item=item)


@router.put("/{cart_id}", response_model=schemas.CartItemWrapper)
def update_cart_item(
    cart_id: str,
    payload: schemas.UpdateCartQuantityRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.CartItemWrapper:
    item = service.update_cart_quantity(
        db=db,
        user_id=user_id,
        cart_id=cart_id,
        quantity=payload.quantity,
    )
    return schemas.CartItemWrapper(item=item)


@router.delete("/{cart_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart_item(
    cart_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    service.remove_cart_item(db=db, user_id=user_id, cart_id=cart_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    service.clear_cart(db=db, user_id=user_id)


