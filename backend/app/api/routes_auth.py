import uuid
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from jose import jwt

from app.config import settings
from app.db.schemas import UserCreateSchema, UserLoginSchema, UserResponseSchema, TokenSchema
from app.db.mongo_client import get_db

router = APIRouter(prefix="/auth", tags=["User Auth"])

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/register", response_model=TokenSchema)
def register_user(payload: UserCreateSchema):
    """Register a new user account with hashed password and signed JWT."""
    db = get_db()
    existing = db.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc).isoformat()
    user_record = {
        "id": user_id,
        "name": payload.name,
        "email": payload.email.lower(),
        "hashed_password": hash_password(payload.password),
        "saved_locations": ["delhi", "mumbai"],
        "created_at": created_at
    }
    db.create_user(user_record)

    token = create_access_token(data={"sub": user_id, "email": payload.email.lower()})

    user_data = UserResponseSchema(
        id=user_id,
        name=payload.name,
        email=payload.email.lower(),
        saved_locations=["delhi", "mumbai"],
        created_at=created_at
    )
    return TokenSchema(
        access_token=token,
        token_type="bearer",
        user=user_data
    )

@router.post("/login", response_model=TokenSchema)
def login_user(
    payload: Optional[UserLoginSchema] = None,
    email: Optional[str] = None,
    password: Optional[str] = None
):
    """Authenticate user with email and password, returning signed JWT."""
    login_email = payload.email if (payload and payload.email) else (email or "demo@airsense.ai")
    login_password = payload.password if (payload and payload.password) else (password or "demo123")

    db = get_db()
    user_record = db.get_user_by_email(login_email)

    if not user_record:
        # Default fallback for demo user if not yet in database
        if login_email.lower() == "demo@airsense.ai" and login_password == "demo123":
            user_record = {
                "id": "usr_demo_1",
                "name": "Demo Researcher",
                "email": "demo@airsense.ai",
                "hashed_password": hash_password("demo123"),
                "saved_locations": ["delhi", "mumbai", "bengaluru"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            db.create_user(user_record)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )
    else:
        if not verify_password(login_password, user_record.get("hashed_password", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

    token = create_access_token(data={"sub": user_record["id"], "email": user_record["email"]})

    user_data = UserResponseSchema(
        id=user_record["id"],
        name=user_record["name"],
        email=user_record["email"],
        saved_locations=user_record.get("saved_locations", ["delhi"]),
        created_at=user_record["created_at"]
    )
    return TokenSchema(
        access_token=token,
        token_type="bearer",
        user=user_data
    )
