from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import jobs, applications

app = FastAPI(
    title="Agentic Recruitment API",
    description="Backend orchestration for AI-powered recruitment",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(jobs.router)
app.include_router(applications.router)

@app.get("/")
def root():
    return {
        "message": "Agentic Recruitment API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}