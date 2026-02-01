from fastapi import Header, HTTPException
from app.database import supabase

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized: No signal detected.")
    
    try:
        token = authorization.split(" ")[1]
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Session expired.")
            
        return user_response.user
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid Auth Signal.")