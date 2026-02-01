import os
import json
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

# OpenRouter uses the OpenAI SDK format, just with a different base_url
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("OPENROUTER_API_KEY"),
)

def analyze_mission_specialist(resume_text: str, job_description: str):
    # Model: Using a high-parameter open-source model via OpenRouter
    # 'liquid/lfm-40b' or 'meta-llama/llama-3.1-405b' are great, 
    # but for a '120b' free-ish vibe, 'qwen/qwen-2-72b-instruct' is extremely precise.
    selected_model = "meta-llama/llama-3-70b-instruct" # Replace with your preferred OpenRouter ID

    prompt = f"""
    You are the Space42 Orbital Recruitment Agent. 
    Analyze the following resume against the Job Description.
    
    JOB DESCRIPTION: {job_description}
    RESUME TEXT: {resume_text}
    
    Return ONLY a JSON object with this exact structure:
    {{
      "full_name": "string",
      "email": "string",
      "github_url": "string",
      "linkedin_url": "string",
      "phone": "string",
      "skills": ["list", "of", "skills"],
      "total_experience_years": "string",
      "summary": "2-sentence professional summary",
      "ats_score": 0-100,
      "ats_reasons": ["3 specific reasons for the score"]
    }}
    """
    
    response = client.chat.completions.create(
        model=selected_model,
        messages=[
            {"role": "system", "content": "You are a precise data extraction agent. Output valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        response_format={ "type": "json_object" } # Ensure the model supports JSON mode
    )
    
    return json.loads(response.choices[0].message.content)