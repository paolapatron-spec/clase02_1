from fastapi import APIRouter

router = APIRouter()

auth_db = []

@router.post("/login")
def login(data: dict):
    correo = data.get("correo")
    contraseña = data.get("contraseña")
    return {
        "mensaje": "Login exitoso",
        "correo": correo,
        "contraseña": contraseña
    }

@router.post("/register")
def register(data: dict):
    correo = data.get("correo")
    contraseña = data.get("contraseña")
    auth_db.append({"correo": correo, "contraseña": contraseña})
    return {
        "mensaje": "Registro exitoso",
        "correo": correo,
        "contraseña": contraseña
    }