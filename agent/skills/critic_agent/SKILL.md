# SKILL: Critic Agent

## Overview
The 'Critic' is the post-render Quality Assurance sovereign in the LuxAura Agentic Loop. It acts as a professional Film Director and Fashion Critic to perform visual audits on every render.

## Core Functions
1.  **Structural DNA Audit**: Performs high-fidelity topological comparisons between the source asset and the AI render.
    - Deviation Threshold: 2%.
    - If deviation is > 2%, the render is REJECTED.
2.  **Skin Realism Audit**: Identifies "Plastic AI Sheen" or "The Doll Effect" in generated human models.
    - Scans for micro-pore texture and plausible surface reflections.
3.  **Technical Debt Mapping**: Identifies areas of lost detail (e.g., hair texture, fabric weaves) and generates a report.
4.  **Critic's Notes Generation**: Provides technical instructions to the generation agent for corrective actions.

## Logic Integration
- **Input Image A**: Original asset lock source.
- **Input Image B**: 4K AI Render output.
- **Process**: Multi-modal vision analysis (Vertex AI Gemini 1.5 Pro).
- **Result**: JSON-formatted audit report with explicit Approval/Rejection status.

## Rules
- Never approve a render with >2% structural deviation.
- Prioritize "Deep Rich" skin texture fidelity and "85mm Lens" realistic depth of field.
- Log every rejection to Cloud Logging for loop refinement.
