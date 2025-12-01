"""
AI Chat Service for ScholarStream Assistant
Real-time conversational AI powered by Gemini
"""
import google.generativeai as genai
import json
from typing import Dict, Any, List, Optional
import structlog
from datetime import datetime, timedelta

from app.models import UserProfile
from app.database import db
from app.config import settings

logger = structlog.get_logger()


class ChatService:
    """AI Chat Assistant powered by Gemini"""
    
    def __init__(self):
        """Initialize Gemini using settings"""
        if not settings.gemini_api_key:
            raise Exception("GEMINI_API_KEY not configured in settings")
        
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
        logger.info("Chat service initialized", model=settings.gemini_model)
    
    async def chat(
        self,
        user_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process chat message and return AI response
        """
        try:
            # Build context-rich prompt
            system_prompt = self._build_system_prompt(context)
            
            # Check if we need to search opportunities
            needs_search = self._detect_search_intent(message)
            
            opportunities = []
            if needs_search:
                # Search based on message
                search_criteria = await self._extract_search_criteria(message, context.get('user_profile', {}))
                opportunities = await self._search_opportunities(search_criteria)
                
                # Add opportunities to prompt
                if opportunities:
                    system_prompt += f"\n\nSEARCH RESULTS ({len(opportunities)} found):\n"
                    for i, opp in enumerate(opportunities[:5], 1):
                        system_prompt += f"\n{i}. {opp.get('name')} - ${opp.get('amount', 0):,}\n"
                        system_prompt += f"   Type: {opp.get('type', 'scholarship')}\n"
                        system_prompt += f"   Deadline: {opp.get('deadline', 'Rolling')}\n"
                        system_prompt += f"   Urgency: {opp.get('urgency', 'future')}\n"
            
            # Generate AI response
            full_prompt = system_prompt + f"\n\nUSER MESSAGE: {message}\n\nRespond helpfully:"
            
            response = await self.model.generate_content_async(full_prompt)
            ai_message = response.text
            
            # Save conversation
            await self._save_message(user_id, "user", message)
            await self._save_message(user_id, "assistant", ai_message)
            
            return {
                'message': ai_message,
                'opportunities': opportunities[:10] if opportunities else [],
                'actions': self._generate_actions(opportunities, message)
            }
            
        except Exception as e:
            logger.error("Chat failed", error=str(e))
            return {
                'message': "I'm experiencing technical difficulties. Could you try rephrasing your question?",
                'opportunities': [],
                'actions': []
            }
    
    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        """Build context-rich system prompt"""
        profile = context.get('user_profile', {})
        page = context.get('current_page', 'unknown')
        
        prompt = f"""You are ScholarStream Assistant, an AI that helps students find financial opportunities.

STUDENT PROFILE:
- Name: {profile.get('name', 'Student')}
- Major: {profile.get('major', 'Unknown')}
- GPA: {profile.get('gpa', 'Unknown')}
- Year: {profile.get('academic_status', 'Unknown')}
- Interests: {', '.join(profile.get('interests', []))}

CURRENT CONTEXT:
- Page: {page}
- Matched opportunities: {context.get('matched_count', 0)}
- Applications in progress: {context.get('applications_count', 0)}

YOUR CAPABILITIES:
1. Search for scholarships, hackathons, bounties, competitions, and grants
2. Recommend personalized opportunities
3. Answer questions about opportunities
4. Help with application strategies
5. Provide financial aid advice

RESPONSE STYLE:
- Be conversational and encouraging
- If finding opportunities, explain WHY each fits the student
- Prioritize URGENT opportunities for immediate needs
- Use emojis sparingly (🎯 for matches, ⏰ for deadlines, 💰 for money)
- Always provide actionable next steps
- Be concise but helpful"""
        
        return prompt
    
    def _detect_search_intent(self, message: str) -> bool:
        """Detect if user wants to search for opportunities"""
        intent_keywords = [
            'find', 'search', 'show me', 'need money', 'urgent', 'hackathon',
            'scholarship', 'bounty', 'competition', 'opportunity', 'apply',
            'deadline', 'this week', 'today', 'tomorrow', 'help me find',
            'looking for', 'need', 'want'
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in intent_keywords)
    
    async def _extract_search_criteria(self, message: str, profile: Dict) -> Dict[str, Any]:
        """Extract search parameters from natural language"""
        message_lower = message.lower()
        
        criteria = {
            'types': [],
            'urgency': 'any',
            'min_amount': None,
            'keywords': []
        }
        
        # Detect types
        if 'hackathon' in message_lower:
            criteria['types'].append('hackathon')
        if 'bounty' in message_lower or 'bounties' in message_lower:
            criteria['types'].append('bounty')
        if 'scholarship' in message_lower:
            criteria['types'].append('scholarship')
        if 'competition' in message_lower:
            criteria['types'].append('competition')
        
        # Default to all types if none specified
        if not criteria['types']:
            criteria['types'] = ['scholarship', 'hackathon', 'bounty', 'competition']
        
        # Detect urgency
        if any(word in message_lower for word in ['urgent', 'now', 'today', 'asap', 'immediately']):
            criteria['urgency'] = 'immediate'
        elif any(word in message_lower for word in ['this week', 'soon', 'quickly']):
            criteria['urgency'] = 'this_week'
        elif any(word in message_lower for word in ['this month', 'month']):
            criteria['urgency'] = 'this_month'
        
        return criteria
    
    async def _search_opportunities(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search opportunities based on criteria"""
        try:
            # Get all opportunities from database
            all_opps = await db.get_all_scholarships()
            
            # Filter by type
            if criteria.get('types'):
                all_opps = [o for o in all_opps if any(t in str(o.tags).lower() or t in str(o.description).lower() for t in criteria['types'])]
            
            # Filter by urgency
            urgency = criteria.get('urgency', 'any')
            if urgency != 'any':
                now = datetime.now()
                filtered = []
                for opp in all_opps:
                    deadline = opp.deadline
                    if not deadline:
                        if urgency == 'immediate':
                            filtered.append(opp)  # Rolling deadlines
                        continue
                    
                    try:
                        deadline_date = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
                        days_until = (deadline_date - now).days
                        
                        if urgency == 'immediate' and days_until <= 2:
                            filtered.append(opp)
                        elif urgency == 'this_week' and days_until <= 7:
                            filtered.append(opp)
                        elif urgency == 'this_month' and days_until <= 30:
                            filtered.append(opp)
                    except:
                        continue
                
                all_opps = filtered
            
            # Convert to dict format
            results = []
            for opp in all_opps[:20]:  # Limit to 20
                results.append({
                    'id': opp.id,
                    'name': opp.name,
                    'organization': opp.organization,
                    'amount': opp.amount,
                    'amount_display': opp.amount_display,
                    'deadline': opp.deadline,
                    'type': self._infer_type(opp),
                    'urgency': self._calculate_urgency(opp),
                    'match_score': opp.match_score,
                    'url': opp.source_url,
                    'tags': opp.tags,
                    'description': opp.description
                })
            
            # Sort by match score
            results.sort(key=lambda x: x.get('match_score', 0), reverse=True)
            
            return results
            
        except Exception as e:
            logger.error("Search failed", error=str(e))
            return []
    
    def _infer_type(self, opp) -> str:
        """Infer opportunity type from tags/description"""
        tags_str = ' '.join(opp.tags or []).lower()
        desc_str = (opp.description or '').lower()
        combined = f"{tags_str} {desc_str}"
        
        if 'hackathon' in combined or 'hack' in combined:
            return 'hackathon'
        elif 'bounty' in combined or 'bug' in combined:
            return 'bounty'
        elif 'competition' in combined or 'contest' in combined:
            return 'competition'
        else:
            return 'scholarship'
    
    def _calculate_urgency(self, opp) -> str:
        """Calculate urgency from deadline"""
        if not opp.deadline:
            return 'immediate'  # Rolling deadline
        
        try:
            deadline_date = datetime.fromisoformat(opp.deadline.replace('Z', '+00:00'))
            days_until = (deadline_date - datetime.now()).days
            
            if days_until <= 2:
                return 'immediate'
            elif days_until <= 7:
                return 'this_week'
            elif days_until <= 30:
                return 'this_month'
            else:
                return 'future'
        except:
            return 'future'
    
    def _generate_actions(self, opportunities: List[Dict], message: str) -> List[Dict[str, Any]]:
        """Generate suggested actions"""
        actions = []
        
        if opportunities:
            # Add save action for top opportunities
            for opp in opportunities[:3]:
                actions.append({
                    'type': 'save',
                    'opportunity_id': opp.get('id'),
                    'label': f"Save {opp.get('name', 'opportunity')}"
                })
        
        return actions
    
    async def _save_message(self, user_id: str, role: str, content: str):
        """Save conversation to database"""
        try:
            # Save to Firebase (implement in db.py)
            await db.save_chat_message(user_id, role, content)
        except Exception as e:
            logger.error("Failed to save message", error=str(e))


# Global chat service instance
chat_service = ChatService()
