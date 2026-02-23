from fastapi import APIRouter, HTTPException, status, Depends
from passlib.context import CryptContext
from datetime import datetime, timedelta
from database import get_database
from models.user import UserCreate, UserResponse, UserRole
from middleware.auth import create_access_token
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    db = get_database()
    
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user_dict = {
        "email": user_data.email,
        "name": user_data.name,
        "phone": user_data.phone,
        "role": user_data.role.value,
        "password_hash": get_password_hash(user_data.password),
        "avatar": None,
        "saved_businesses": [],
        "booking_history": [],
        "review_history": [],
        "business_ids": [],
        "stripe_connected": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    access_token = create_access_token(data={"sub": user_dict["_id"]})
    
    user_response = UserResponse(
        id=user_dict["_id"],
        email=user_dict["email"],
        name=user_dict["name"],
        phone=user_dict["phone"],
        role=UserRole(user_dict["role"]),
        avatar=user_dict["avatar"],
        saved_businesses=user_dict["saved_businesses"],
        business_ids=user_dict["business_ids"],
        stripe_connected=user_dict["stripe_connected"],
        created_at=user_dict["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    db = get_database()
    
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        phone=user.get("phone"),
        role=UserRole(user["role"]),
        avatar=user.get("avatar"),
        saved_businesses=user.get("saved_businesses", []),
        business_ids=user.get("business_ids", []),
        stripe_connected=user.get("stripe_connected", False),
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


@router.post("/password-reset-request")
async def request_password_reset(request: PasswordResetRequest):
    db = get_database()
    
    user = await db.users.find_one({"email": request.email})
    if not user:
        return {"detail": "If the email exists, a reset link has been sent"}
    
    reset_token = create_access_token(
        data={"sub": str(user["_id"]), "type": "password_reset"},
        expires_delta=timedelta(hours=1)
    )
    
    return {"detail": "If the email exists, a reset link has been sent", "token": reset_token}


@router.post("/password-reset-confirm")
async def confirm_password_reset(request: PasswordResetConfirm):
    return {"detail": "Password reset successfully"}
