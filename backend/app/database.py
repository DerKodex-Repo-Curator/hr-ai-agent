from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from app.config import settings

load_dotenv()

# Use the environment variable loaded by load_dotenv()
# Fetch variables
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

# Construct the SQLAlchemy connection string
DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

SQLALCHEMY_DATABASE_URL = DATABASE_URL

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL is missing! Check your .env file.")

# 1. SQLALCHEMY SETUP (For DB Queries)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. SUPABASE CLIENT SETUP (For Storage/Auth)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# 3. FASTAPI DEPENDENCY
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()