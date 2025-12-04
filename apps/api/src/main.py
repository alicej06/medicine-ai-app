from fastapi import FastAPI
from src.routers import health, drug, explain, interactions, auth, medications, med_overview, pill_label
from fastapi.middleware.cors import CORSMiddleware

# these modules live in src/routers/
from src.routers.drugs import router as drugs_router  # <-- new line

app = FastAPI()

app.include_router(health.router)
app.include_router(drug.router)
app.include_router(explain.router)
app.include_router(interactions.router)
app.include_router(pill_label.router)  
app.include_router(drugs_router)

app.include_router(auth.router)
app.include_router(medications.router)
app.include_router(med_overview.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
