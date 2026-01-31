from supabase import create_client, Client
from app.config import settings

# Singleton Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_db():
    """Dependency for getting database connection"""
    return supabase