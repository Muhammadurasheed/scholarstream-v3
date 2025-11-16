"""
AI Enrichment Service
Batch enrichment of opportunities using Gemini
"""
import google.generativeai as genai
from typing import List, Dict, Any
import json
import asyncio
import structlog
from datetime import datetime

from app.config import settings

logger = structlog.get_logger()


class AIEnrichmentService:
    """
    Enriches raw opportunity data using Gemini AI
    Processes in batches to optimize API usage
    """
    
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
        self.batch_size = 10  # Process 10 opportunities at once
    
    async def enrich_opportunities_batch(
        self,
        raw_opportunities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Enrich opportunities in batches
        Returns structured, validated opportunity data
        """
        logger.info("Starting batch enrichment", total=len(raw_opportunities))
        
        enriched = []
        batches = [
            raw_opportunities[i:i + self.batch_size]
            for i in range(0, len(raw_opportunities), self.batch_size)
        ]
        
        for batch_idx, batch in enumerate(batches):
            try:
                batch_enriched = await self._enrich_batch(batch)
                enriched.extend(batch_enriched)
                
                logger.info(
                    "Batch enriched",
                    batch_num=batch_idx + 1,
                    total_batches=len(batches),
                    count=len(batch_enriched)
                )
                
                # Rate limiting: wait between batches
                if batch_idx < len(batches) - 1:
                    await asyncio.sleep(2)
                    
            except Exception as e:
                logger.error(
                    "Batch enrichment failed",
                    batch_num=batch_idx + 1,
                    error=str(e)
                )
                # Return raw data as fallback
                enriched.extend(batch)
        
        logger.info("Enrichment complete", total=len(enriched))
        return enriched
    
    async def _enrich_batch(self, batch: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enrich a single batch using Gemini"""
        
        prompt = f"""
You are a financial opportunity data structuring expert. Clean and validate this opportunity data.

RAW DATA (array of opportunities):
{json.dumps(batch, indent=2)}

For EACH opportunity, validate and return structured JSON with these fields:
- Keep all existing fields
- Ensure all required fields are present
- Fix any data quality issues
- Standardize date formats to YYYY-MM-DD
- Ensure amounts are numeric

Return ONLY a JSON array, no markdown, no preamble.
Today's date: {datetime.now().strftime('%Y-%m-%d')}
"""
        
        try:
            response = await self.model.generate_content_async(prompt)
            text = response.text.strip()
            
            # Strip markdown if present
            if text.startswith("```json"):
                text = text.split("```json")[1].split("```")[0].strip()
            elif text.startswith("```"):
                text = text.split("```")[1].split("```")[0].strip()
            
            enriched_batch = json.loads(text)
            
            # Validate it's a list
            if not isinstance(enriched_batch, list):
                logger.warning("Enrichment returned non-list, using original")
                return batch
            
            return enriched_batch
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse enrichment response", error=str(e))
            return batch
        except Exception as e:
            logger.error("Enrichment error", error=str(e))
            return batch


# Global instance
ai_enrichment_service = AIEnrichmentService()
