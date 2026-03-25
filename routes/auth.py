from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class User(BaseModel):
    correo: str
    contraseña: str

auth_db = []

@router.post("/login")
def login(data: User):
    return {
        "mensaje": "Login exitoso",
        "correo": data.correo,
        "contraseña": data.contraseña
    }

@router.post("/register")
def register(data: User):
    auth_db.append({"correo": data.correo, "contraseña": data.contraseña})
    return {
        "mensaje": "Registro exitoso",
        "correo": data.correo,
        "contraseña": data.contraseña
    }