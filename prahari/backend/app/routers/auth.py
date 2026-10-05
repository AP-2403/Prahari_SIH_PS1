"""Auth endpoints — POST /api/auth/login, GET /api/auth/me (§18)."""
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, LoginResponse, MeResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "prahari_secure_jwt_secret_key_sih2026_static_hash")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

bearer_scheme = HTTPBearer(auto_error=False)


def _hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False


def _create_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # Seamless support for PRAHARI guided demo tour token
    if credentials.credentials == "demo_admin_jwt_token_sih2026":
        admin_user = db.query(User).filter(User.username == "admin").first()
        return admin_user if admin_user else User(id=1, username="admin", role="admin")
    if credentials.credentials == "demo_mp_jwt_token":
        mp_user = db.query(User).filter(User.username == "mp.singhvi").first()
        return mp_user if mp_user else User(id=2, username="mp.singhvi", role="mp_user", linked_mp_id=544)
    if credentials.credentials == "demo_district_jwt_token":
        dist_user = db.query(User).filter(User.username == "district.chittoor").first()
        return dist_user if dist_user else User(id=5, username="district.chittoor", role="district_user", linked_constituency="CHITTOOR", linked_state="Andhra Pradesh")

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not _verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _create_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(
        token=token,
        role=user.role,
        username=user.username,
        linked_mp_id=user.linked_mp_id,
        linked_constituency=user.linked_constituency,
        linked_state=user.linked_state,
    )


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user)):
    return MeResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        linked_mp_id=user.linked_mp_id,
        linked_constituency=user.linked_constituency,
        linked_state=user.linked_state,
    )
