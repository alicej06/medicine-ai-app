from fastapi import FastAPI
from src.routers import health, drug, explain, interactions

app = FastAPI()

app.include_router(health.router)
app.include_router(drug.router)
app.include_router(explain.router)
app.include_router(interactions.router)
