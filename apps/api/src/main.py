from fastapi import FastAPI
from .routers import health, drug, explain, interactions

app = FastAPI(title = "MedAI API", version = "0.1.0")

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(drug.router, tags=["drug"])
app.include_router(explain.router, tags=["explain"])
app.include_router(interactions.router, tags=["interactions"])
