from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def saludar():
    return {"mensaje": "¡Hola! Bienvenido a mi API"}

@app.get("/bienvenido/{nombre}")
def saludar_persona(nombre: str):
    return {"mensaje": f"Hola {nombre}, ¡qué bueno verte por aquí!"}

from routes.auth import router as auth_router
from routes.servicios import router as servicios_router

app.include_router(auth_router)
app.include_router(servicios_router)
