from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import jobs, applications

app = FastAPI(
    title="Agentic Recruitment API",
    description="Backend orchestration for AI-powered recruitment",
    version="1.0.0"
)

app = FastAPI(redirect_slashes=False)

# CORS middleware
origins = [
    "http://localhost:3000",    # Your Next.js local development address
    "http://127.0.0.1:3000",
    "https://hr-ai-agent-per01f79c-joel-eldho.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allows all headers
)

# Include routers
# app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
# app.include_router(applications.router, prefix="/applications", tags=["Applications"])
app.include_router(jobs.router)
app.include_router(applications.router)

@app.get("/")
def root():
    return {"message": "Mission Control Online"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}