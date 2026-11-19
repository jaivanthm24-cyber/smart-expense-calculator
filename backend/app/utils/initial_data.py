from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.savings import SavingsGoal, SavingsContribution
from app.core.security import hash_password

DEFAULT_SYSTEM_CATEGORIES = [
    # Income
    {"name": "Salary", "type": "income", "icon": "briefcase", "color": "#10b981"},
    {"name": "Freelancing", "type": "income", "icon": "laptop", "color": "#3b82f6"},
    {"name": "Business", "type": "income", "icon": "building", "color": "#8b5cf6"},
    {"name": "Investments", "type": "income", "icon": "trending-up", "color": "#06b6d4"},
    {"name": "Other Income", "type": "income", "icon": "plus-circle", "color": "#64748b"},
    # Expenses
    {"name": "Food & Dining", "type": "expense", "icon": "utensils", "color": "#ef4444"},
    {"name": "Transportation", "type": "expense", "icon": "car", "color": "#f97316"},
    {"name": "Shopping", "type": "expense", "icon": "shopping-bag", "color": "#ec4899"},
    {"name": "Education", "type": "expense", "icon": "graduation-cap", "color": "#6366f1"},
    {"name": "Entertainment", "type": "expense", "icon": "film", "color": "#a855f7"},
    {"name": "Healthcare", "type": "expense", "icon": "heart-pulse", "color": "#14b8a6"},
    {"name": "Bills & Utilities", "type": "expense", "icon": "receipt", "color": "#eab308"},
    {"name": "Rent & Housing", "type": "expense", "icon": "home", "color": "#0284c7"},
    {"name": "Travel", "type": "expense", "icon": "plane", "color": "#f43f5e"},
    {"name": "Other Expense", "type": "expense", "icon": "more-horizontal", "color": "#71717a"},
]


def seed_system_categories(db: Session) -> None:
    for cat in DEFAULT_SYSTEM_CATEGORIES:
        existing = (
            db.query(Category)
            .filter(
                Category.is_system == True,
                Category.name == cat["name"],
                Category.type == cat["type"],
            )
            .first()
        )
        if not existing:
            new_cat = Category(
                user_id=None,
                name=cat["name"],
                type=cat["type"],
                icon=cat["icon"],
                color=cat["color"],
                is_system=True,
            )
            db.add(new_cat)
    db.commit()


def seed_demo_user(db: Session) -> User:
    seed_system_categories(db)
    
    # Check or create demo user
    demo_email = "testuser@example.com"
    user = db.query(User).filter(User.email == demo_email).first()
    
    new_hash = hash_password("Password123!")
    if not user:
        user = User(
            email=demo_email,
            hashed_password=new_hash,
            full_name="Alex Morgan",
            currency="USD",
            monthly_income_target=Decimal("7500.00"),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Guarantee password matches Password123!
        user.hashed_password = new_hash
        user.is_active = True
        db.commit()
        db.refresh(user)

    # Check if user already has data seeded
    has_expenses = db.query(Expense).filter(Expense.user_id == user.id).first()
    if has_expenses:
        return user

    # Lookup categories
    categories = {c.name: c.id for c in db.query(Category).all()}
    today = date.today()
    y, m = today.year, today.month

    # 1. Seed Sample Incomes
    incomes = [
        Income(
            user_id=user.id,
            category_id=categories.get("Salary"),
            title="Senior Engineer Monthly Salary",
            amount=Decimal("6200.00"),
            date=date(y, m, 1),
            payment_method="Direct Deposit",
            description="Base net monthly compensation",
        ),
        Income(
            user_id=user.id,
            category_id=categories.get("Freelancing"),
            title="Design System Consulting",
            amount=Decimal("1450.00"),
            date=date(y, m, min(10, today.day)),
            payment_method="Bank Transfer",
            description="Client deliverable Milestone 2",
        ),
        Income(
            user_id=user.id,
            category_id=categories.get("Investments"),
            title="Index Fund Dividend Yield",
            amount=Decimal("380.00"),
            date=date(y, m, min(15, today.day)),
            payment_method="Bank Transfer",
            description="Vanguard quarterly ETF distributions",
        ),
    ]
    db.add_all(incomes)

    # 2. Seed Sample Expenses
    expenses = [
        Expense(
            user_id=user.id,
            category_id=categories.get("Rent & Housing"),
            title="Apartment Lease Payment",
            amount=Decimal("1550.00"),
            date=date(y, m, 2),
            payment_method="Bank Transfer",
            description="Monthly apartment rent payment",
            notes="Includes water and trash removal",
        ),
        Expense(
            user_id=user.id,
            category_id=categories.get("Food & Dining"),
            title="Whole Foods Weekly Market",
            amount=Decimal("182.40"),
            date=date(y, m, min(5, today.day)),
            payment_method="Credit Card",
            description="Organic groceries, fresh produce, coffee",
        ),
        Expense(
            user_id=user.id,
            category_id=categories.get("Bills & Utilities"),
            title="High-Speed Fiber Internet & Electricity",
            amount=Decimal("145.00"),
            date=date(y, m, min(7, today.day)),
            payment_method="Credit Card",
            description="Utility provider autopay",
        ),
        Expense(
            user_id=user.id,
            category_id=categories.get("Transportation"),
            title="Subway Transit Pass & Uber",
            amount=Decimal("88.50"),
            date=date(y, m, min(11, today.day)),
            payment_method="Credit Card",
            description="Monthly city travel expenses",
        ),
        Expense(
            user_id=user.id,
            category_id=categories.get("Shopping"),
            title="Ergonomic Desk Chair Upgrade",
            amount=Decimal("260.00"),
            date=date(y, m, min(14, today.day)),
            payment_method="Credit Card",
            description="Home office workspace comfort",
        ),
        Expense(
            user_id=user.id,
            category_id=categories.get("Healthcare"),
            title="Gym Membership & Supplements",
            amount=Decimal("85.00"),
            date=date(y, m, min(16, today.day)),
            payment_method="Debit Card",
            description="Fitness wellness subscription",
        ),
    ]
    db.add_all(expenses)

    # 3. Seed Monthly Budgets
    budgets = [
        Budget(
            user_id=user.id,
            category_id=None,  # Overall
            amount=Decimal("3400.00"),
            month=m,
            year=y,
            alert_threshold=80,
        ),
        Budget(
            user_id=user.id,
            category_id=categories.get("Food & Dining"),
            amount=Decimal("600.00"),
            month=m,
            year=y,
            alert_threshold=80,
        ),
        Budget(
            user_id=user.id,
            category_id=categories.get("Rent & Housing"),
            amount=Decimal("1600.00"),
            month=m,
            year=y,
            alert_threshold=90,
        ),
        Budget(
            user_id=user.id,
            category_id=categories.get("Shopping"),
            amount=Decimal("400.00"),
            month=m,
            year=y,
            alert_threshold=75,
        ),
        Budget(
            user_id=user.id,
            category_id=categories.get("Transportation"),
            amount=Decimal("200.00"),
            month=m,
            year=y,
            alert_threshold=80,
        ),
    ]
    db.add_all(budgets)

    # 4. Seed Savings Goals
    goal1 = SavingsGoal(
        user_id=user.id,
        name="Emergency Security Reserve",
        target_amount=Decimal("12000.00"),
        current_amount=Decimal("8500.00"),
        target_date=today + timedelta(days=120),
        category="Emergency",
        notes="6 months of baseline living expenses stored in high-yield account.",
        status="in_progress",
    )
    goal2 = SavingsGoal(
        user_id=user.id,
        name="Apple MacBook Pro M4 Max",
        target_amount=Decimal("3499.00"),
        current_amount=Decimal("2800.00"),
        target_date=today + timedelta(days=45),
        category="Tech",
        notes="High-performance workstation for development and compiling.",
        status="in_progress",
    )
    goal3 = SavingsGoal(
        user_id=user.id,
        name="Tokyo Autumn Vacation",
        target_amount=Decimal("4500.00"),
        current_amount=Decimal("1850.00"),
        target_date=today + timedelta(days=210),
        category="Travel",
        notes="Flights, boutique ryokan stays, and culinary experiences.",
        status="in_progress",
    )
    db.add_all([goal1, goal2, goal3])
    db.commit()

    return user
