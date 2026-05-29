import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

# Import the critic agent logic
try:
    from agents.critic_agent import CriticAgent
except ImportError:
    # Fallback if structure is different
    from CriticAgent import CriticAgent

# Initialize FastAPI with metadata for Cloud Run
app = FastAPI(
    title="LuxAura Sovereign Backend",
    description="Scalable agentic backend supporting Replicant Influencers and 1,000+ SaaS subscribers.",
    version="1.0.0"
)

# CORS configuration for Vercel/Frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agent
critic = CriticAgent(project_id=os.getenv("GOOGLE_CLOUD_PROJECT", "luxaura-studio"))

# Models
class AuditRequest(BaseModel):
    original_base64: str
    rendered_base64: str

class ReplicantRequest(BaseModel):
    influencer_id: str
    action: str
    context: Optional[Dict[str, Any]] = None

@app.get("/health")
def health_check():
    """Cloud Run Health Check."""
    return {"status": "SOVEREIGN_READY", "concurrency_support": "HIGH", "scaling": "AUTO"}

@app.post("/audit")
async def audit_render(request: AuditRequest):
    """
    Executes the CriticAgent Multimodal Audit.
    Supports concurrency for 20+ Replicant loops simultaneously.
    """
    try:
        report = critic.audit_render(request.original_base64, request.rendered_base64)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-replicant")
async def generate_replicant(request: ReplicantRequest):
    """
    Handles generation/action for Replicant Influencers.
    Designed for 20 concurrent high-performance agentic flows.
    """
    # Logic for Replicant generation (Placeholder for now)
    return {
        "influencer_id": request.influencer_id,
        "status": "PROCESSED",
        "action_taken": request.action,
        "message": "Replicant state updated in high-concurrency layer."
    }

if __name__ == "__main__":
    # Port is provided by Cloud Run environment variable PORT
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
