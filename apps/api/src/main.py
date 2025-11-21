from fastapi import FastAPI
from src.routers import health, drug, explain, interactions, auth, medications
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.include_router(health.router)
app.include_router(drug.router)
app.include_router(explain.router)
app.include_router(interactions.router)
app.include_router(auth.router)
app.include_router(medications.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
