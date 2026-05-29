import os
import json
import logging
import base64
from typing import Dict, Any, Optional

# vertexai and google-cloud-logging usually need to be installed:
# pip install google-cloud-aiplatform google-cloud-logging

try:
    import vertexai
    from vertexai.generative_models import GenerativeModel, Part, Image as VertexImage
    from google.cloud import logging as cloud_logging
except ImportError:
    # Fallback/Mock for local dev without dependencies
    vertexai = None
    cloud_logging = None

class CriticAgent:
    """
    AGENT_CRITIC: The post-render Quality Assurance sovereign for LuxAura.
    Performs a Multimodal Audit on renders using Vertex AI (Gemini 1.5 Pro).
    
    Core Directives:
    1. Structural DNA Audit: Threshold of >2% topology deviation for rejection.
    2. Skin Realism Audit: Scan for 'Plastic AI Sheen' and 'The Doll Effect'.
    3. Technical Debt Identification: Locate 'frozen' logic and lost texture nodes.
    """

    def __init__(self, project_id: str = "luxaura-studio", location: str = "us-central1"):
        self.project_id = project_id
        self.location = location
        self._init_services()

    def _init_services(self):
        """Initializes Google Cloud services with proper logging."""
        if vertexai:
            vertexai.init(project=self.project_id, location=self.location)
            self.model = GenerativeModel("gemini-1.5-pro-002")
        
        # Setup Cloud Logging as requested in Conversation 65ae5f1d-0460-40aa-b5ae-cbfd77acd8d1
        if cloud_logging:
            self.logging_client = cloud_logging.Client()
            self.logger = self.logging_client.logger("luxaura-critic-agent")
        else:
            self.logger = logging.getLogger("LuxAura.CriticAgent")
            logging.basicConfig(level=logging.INFO)

    def audit_render(self, original_base64: str, rendered_base64: str) -> Dict[str, Any]:
        """
        Executes the Multimodal Audit comparing the original asset photo to the AI render.
        """
        self.logger.info("Executing Multimodal Audit on render...")

        # Prompt engineering optimized for technical "Critic" persona
        system_prompt = (
            "You are the 'Critic' in the LuxAura Agentic Loop. Your role is to act as a professional "
            "Film Director and High-Fashion Critic. You are tasked with performing an uncompromising "
            "Multimodal Audit of an AI render (Image B) against a source asset (Image A).\n\n"
            "AUDIT REQUIREMENTS:\n"
            "1. **Structural DNA Audit**: Ensure the category identity (hair, garment, accessory) "
            "is perfectly preserved. Rejection Threshold: >2% topological deviation.\n"
            "2. **Skin Realism Audit**: Identify 'Plastic AI Sheen' or 'The Doll Effect'. Look for "
            "implausible surface reflections, lack of micro-pore texture, or overly smooth gradients.\n"
            "3. **Technical Debt Mapping**: Locate areas where detail is 'frozen' (e.g., hair strands "
            "clumping unnaturally, fabric weave becoming a generic blur).\n\n"
            "OUTPUT FORMAT:\n"
            "You must return a JSON object with the following schema:\n"
            "{\n"
            "  \"status\": \"APPROVED\" | \"REJECTED\",\n"
            "  \"structural_dna_score\": float (0.0-1.0),\n"
            "  \"skin_realism_score\": float (0.0-1.0),\n"
            "  \"critic_notes\": \"Specific technical instruction for the generator agent (e.g., 'The braid at the left temple has lost its structural DNA')\",\n"
            "  \"technical_debt_report\": [\"string list of detail losses\"]\n"
            "}"
        )

        if not vertexai:
            return self._mock_audit_failure("Vertex AI not available - Environment mismatch.")

        try:
            # Prepare multimodal parts
            img_a = Part.from_data(data=base64.b64decode(original_base64), mime_type="image/jpeg")
            img_b = Part.from_data(data=base64.b64decode(rendered_base64), mime_type="image/jpeg")

            response = self.model.generate_content(
                [system_prompt, "Image A (Original):", img_a, "Image B (Rendered):", img_b],
                generation_config={"response_mime_type": "application/json"}
            )

            report = json.loads(response.text)
            
            # Post-processing for business logic thresholds
            if report.get("structural_dna_score", 1.0) < 0.98: # >2% deviation
                report["status"] = "REJECTED"
                report["rejection_reason"] = "Structural DNA threshold violation (>2% deviance)"

            # Log rejection to Cloud Logging for loop training (Conversations Mentioned This)
            if report["status"] == "REJECTED":
                self.logger.log_struct({
                    "event": "RENDER_REJECTED",
                    "notes": report.get("critic_notes"),
                    "structural_score": report.get("structural_dna_score"),
                    "skin_realism_score": report.get("skin_realism_score"),
                    "technical_debt": report.get("technical_debt_report")
                }, severity="WARNING")
            else:
                self.logger.log_struct({"event": "RENDER_APPROVED", "scores": report}, severity="INFO")

            return report

        except Exception as e:
            error_msg = f"Audit Critical Failure: {str(e)}"
            self.logger.log_text(error_msg, severity="ERROR")
            return self._mock_audit_failure(error_msg)

    def _mock_audit_failure(self, error_msg: str) -> Dict[str, Any]:
        """Returns a safe failure state for the agentic loop."""
        return {
            "status": "REJECTED",
            "structural_dna_score": 0.0,
            "skin_realism_score": 0.0,
            "critic_notes": f"Systemic Audit Error: {error_msg}",
            "technical_debt_report": ["System critical error"]
        }

if __name__ == "__main__":
    # Example usage for CLI testing
    agent = CriticAgent()
    print("CriticAgent Module Initialized.")
