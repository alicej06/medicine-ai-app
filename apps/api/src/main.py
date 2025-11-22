from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# these modules live in src/routers/
from src.routers import health, drug, explain, interactions
from src.routers.drugs import router as drugs_router  # <-- new line

app = FastAPI()

# include existing routers
app.include_router(health.router)
app.include_router(drug.router)
app.include_router(explain.router)
app.include_router(interactions.router)

# include the new /drugs/search router
app.include_router(drugs_router)

# CORS for your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
