import os
import pytest
from decimal import Decimal
from datetime import date
from fastapi.testclient import TestClient

# Set test database URL before importing app modules
TEST_DB_FILE = "./test_smart_expense.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"
os.environ["ENVIRONMENT"] = "testing"

from app.core.config import settings
settings.DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"
settings.ENVIRONMENT = "testing"

from app.core.database import Base, engine, SessionLocal, get_db
from app.main import app
from app.utils.initial_data import seed_system_categories
from app.models.user import User
from app.core.security import hash_password


from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.savings import SavingsGoal, SavingsContribution


@pytest.fixture(autouse=True)
def cleanup_user_records(db):
    yield
    db.query(SavingsContribution).delete()
    db.query(SavingsGoal).delete()
    db.query(Budget).delete()
    db.query(Expense).delete()
    db.query(Income).delete()
    db.commit()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError:
            pass
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_system_categories(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError:
            pass


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def test_user(db):
    user = db.query(User).filter(User.email == "testuser@example.com").first()
    if not user:
        user = User(
            email="testuser@example.com",
            hashed_password=hash_password("Password123!"),
            full_name="Test User",
            currency="USD",
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def other_user(db):
    user = db.query(User).filter(User.email == "otheruser@example.com").first()
    if not user:
        user = User(
            email="otheruser@example.com",
            hashed_password=hash_password("Password123!"),
            full_name="Other User",
            currency="EUR",
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={"email": "testuser@example.com", "password": "Password123!"},
    )
    assert response.status_code == 200, f"Login failed: {response.json()}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_auth_headers(client, other_user):
    response = client.post(
        "/api/auth/login",
        json={"email": "otheruser@example.com", "password": "Password123!"},
    )
    assert response.status_code == 200, f"Other login failed: {response.json()}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
