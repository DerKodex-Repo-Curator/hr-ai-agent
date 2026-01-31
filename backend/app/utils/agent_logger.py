from app.database import get_db
from typing import Optional, Dict, Any

class AgentLogger:
    """Logs agent actions to agent_runs table"""
    
    @staticmethod
    def log_run(
        action_name: str,
        entity_type: str,
        entity_id: int,
        input_json: Optional[Dict[str, Any]] = None,
        output_json: Optional[Dict[str, Any]] = None,
        status: str = "pending",
        error: Optional[str] = None
    ) -> int:
        """
        Create a new agent run log entry.
        Returns the created log ID.
        """
        db = get_db()
        
        result = db.table("agent_runs").insert({
            "action_name": action_name,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "input_json": input_json,
            "output_json": output_json,
            "status": status,
            "error": error
        }).execute()
        
        return result.data[0]["id"]
    
    @staticmethod
    def update_run(run_id: int, status: str, output_json: Optional[Dict] = None, error: Optional[str] = None):
        """Update an existing agent run"""
        db = get_db()
        
        update_data = {"status": status}
        if output_json:
            update_data["output_json"] = output_json
        if error:
            update_data["error"] = error
        
        db.table("agent_runs").update(update_data).eq("id", run_id).execute()