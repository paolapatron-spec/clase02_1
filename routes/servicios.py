from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Modelos Pydantic
class Servicio(BaseModel):
    nombre: str
    precio: float

class Mascota(BaseModel):
    correo: str
    nombre: str
    servicio: str
    fecha: str  # O usa datetime si quieres validar la fecha

# Base de datos simulada
servicios_db = [
    {"nombre": "consulta", "precio": 50},
    {"nombre": "baño", "precio": 60},
    {"nombre": "corte", "precio": 100}
]

mascotas_db = []

# Listar los servicios
@router.get("/servicios")
def listar_servicios():
    return {
        "servicios": servicios_db
    }

# Agregar un nuevo servicio
@router.post("/agregar-servicio")
def agregar_servicio(nuevo: Servicio):
    servicios_db.append(nuevo.dict())  # Convertir el objeto Pydantic a un diccionario
    return {
        "mensaje": "¡Servicio guardado!"
    }

# Registrar una nueva mascota
@router.post("/registrar-mascota")
def registrar_mascota(registro: Mascota):
    mascotas_db.append(registro.dict())  # Convertir el objeto Pydantic a un diccionario
    return {
        "mensaje": "Mascota registrada con éxito",
        "datos": registro
    }

# Listar mascotas por dueño
@router.get("/mascotas/{correo}")
def mascotas_por_dueño(correo: str):
    mascotas = [m for m in mascotas_db if m.get("correo") == correo]
    return {
        "correo": correo,
        "mascotas": mascotas
    }

# Reporte por dueño
@router.get("/reporte/{correo}")
def reporte_por_dueño(correo: str):
    mascotas = [m for m in mascotas_db if m.get("correo") == correo]
    total_gastado = 0
    servicios_usados = []

    for m in mascotas:
        tipo = m.get("servicio")
        servicios_usados.append(tipo)
        precio = next((s["precio"] for s in servicios_db if s.get("nombre") == tipo), 0)
        total_gastado += precio

    return {
        "correo": correo,
        "cantidad_servicios": len(mascotas),
        "servicios": servicios_usados,
        "total_gastado": total_gastado
    }