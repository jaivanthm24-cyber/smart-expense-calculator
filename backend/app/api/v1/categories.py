from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[CategoryResponse])
def get_categories(
    type: Optional[str] = Query(None, description="Filter by type: 'income' or 'expense'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Category).filter(
        or_(Category.user_id == current_user.id, Category.is_system == True)
    )
    if type:
        query = query.filter(Category.type == type)
    return query.order_by(Category.name.asc()).all()


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check duplicate name for user
    existing = (
        db.query(Category)
        .filter(
            or_(Category.user_id == current_user.id, Category.is_system == True),
            Category.name.ilike(cat_in.name),
            Category.type == cat_in.type,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{cat_in.name}' for {cat_in.type} already exists.",
        )

    cat = Category(
        user_id=current_user.id,
        name=cat_in.name,
        type=cat_in.type,
        icon=cat_in.icon or "tag",
        color=cat_in.color or "#64748b",
        is_system=False,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(
    cat_id: int,
    cat_in: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = (
        db.query(Category)
        .filter(Category.id == cat_id, Category.user_id == current_user.id)
        .first()
    )
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom category not found or is a protected system category.",
        )

    update_data = cat_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(cat, field, val)

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}", status_code=status.HTTP_200_OK)
def delete_category(
    cat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = (
        db.query(Category)
        .filter(Category.id == cat_id, Category.user_id == current_user.id)
        .first()
    )
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or cannot delete system categories.",
        )

    db.delete(cat)
    db.commit()
    return {"message": "Category successfully deleted"}
