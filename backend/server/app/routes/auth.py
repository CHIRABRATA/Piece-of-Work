from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth, firestore
from app.core.security import verify_token
from app.core.firebase_admin import db
from app.core.config import FIREBASE_WEB_API_KEY
from pydantic import BaseModel
import requests

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegistrationRequest(BaseModel):
    reg_no: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login", status_code=status.HTTP_200_OK)
def login(data: LoginRequest):
    if not FIREBASE_WEB_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FIREBASE_WEB_API_KEY is not set",
        )

    url = (
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={FIREBASE_WEB_API_KEY}"
    )
    payload = {
        "email": data.email,
        "password": data.password,
        "returnSecureToken": True,
    }

    try:
        response = requests.post(url, json=payload, timeout=15)
    except requests.RequestException:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to reach Firebase Auth",
        )

    if response.status_code != 200:
        try:
            error_message = response.json().get("error", {}).get("message")
        except Exception:
            error_message = None

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_message or "Invalid credentials",
        )

    token_data = response.json()
    return {
        "access_token": token_data.get("idToken"),
        "token_type": "bearer",
        "expires_in": token_data.get("expiresIn"),
        "refresh_token": token_data.get("refreshToken"),
        "uid": token_data.get("localId"),
        "email": token_data.get("email"),
    }


@router.post("/verify-registration", status_code=status.HTTP_200_OK)
def verify_registration(
    data: RegistrationRequest,
    user=Depends(verify_token)
):
    uid = user["uid"]
    reg_no = data.reg_no

    if not user.get("email_verified"):
        auth.delete_user(uid)
        raise HTTPException(status_code=403, detail="Email not verified")

    ref = db.collection("valid_students").document(reg_no)
    doc = ref.get()

    if not doc.exists:
        auth.delete_user(uid)
        raise HTTPException(status_code=403, detail="Not a campus student")

    student_info = doc.to_dict()

    if student_info.get("is_registered"):
        auth.delete_user(uid)
        raise HTTPException(status_code=403, detail="Reg no already used")

    ref.update({
        "is_registered": True,
        "uid": uid
    })

    db.collection("users").document(uid).set({
        "reg_no": reg_no,
        "dept": student_info.get("DEPT"),
        "email": user.get("email"),
        "created_at": firestore.SERVER_TIMESTAMP
    })

    print(f"✅ User {uid} registered successfully")

    return {
        "message": "Campus Access Granted",
        "dept": student_info.get("DEPT")
    }
@router.get("/profile", status_code=status.HTTP_200_OK)
def get_profile(user=Depends(verify_token)):
    uid = user["uid"]

    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found")

    profile_data = user_doc.to_dict() or {}

    return {
        **profile_data,
        "email": user.get("email"),
        "email_verified": user.get("email_verified")
    }
