"""
Firebase Firestore database layer
Handles all database operations with proper error handling
"""
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional, List, Dict, Any
from datetime import datetime
import structlog

from app.config import settings
from app.models import Scholarship, UserProfile

logger = structlog.get_logger()


class FirebaseDB:
    """Firebase Firestore database manager"""
    
    def __init__(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if already initialized
            firebase_admin.get_app()
            logger.info("Firebase already initialized")
        except ValueError:
            # Initialize Firebase
            cred = credentials.Certificate(settings.firebase_credentials)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized successfully")
        
        self.db = firestore.client()
    
    # User Profile Operations
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch user profile from Firestore"""
        try:
            doc_ref = self.db.collection('users').document(user_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error("Failed to fetch user profile", user_id=user_id, error=str(e))
            raise
    
    async def update_user_profile(self, user_id: str, profile: UserProfile) -> bool:
        """Update user profile in Firestore"""
        try:
            doc_ref = self.db.collection('users').document(user_id)
            doc_ref.update({
                'profile': profile.model_dump(),
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            logger.info("User profile updated", user_id=user_id)
            return True
        except Exception as e:
            logger.error("Failed to update user profile", user_id=user_id, error=str(e))
            raise
    
    # Scholarship Operations
    async def save_scholarship(self, scholarship: Scholarship) -> bool:
        """Save scholarship to Firestore"""
        try:
            doc_ref = self.db.collection('scholarships').document(scholarship.id)
            doc_ref.set(scholarship.model_dump())
            logger.info("Scholarship saved", scholarship_id=scholarship.id)
            return True
        except Exception as e:
            logger.error("Failed to save scholarship", scholarship_id=scholarship.id, error=str(e))
            raise
    
    async def get_scholarship(self, scholarship_id: str) -> Optional[Scholarship]:
        """Fetch single scholarship by ID"""
        try:
            doc_ref = self.db.collection('scholarships').document(scholarship_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                return Scholarship(**data)
            return None
        except Exception as e:
            logger.error("Failed to fetch scholarship", scholarship_id=scholarship_id, error=str(e))
            raise
    
    async def get_all_scholarships(self) -> List[Scholarship]:
        """Fetch all scholarships from cache"""
        try:
            docs = self.db.collection('scholarships').stream()
            scholarships = []
            
            for doc in docs:
                try:
                    scholarships.append(Scholarship(**doc.to_dict()))
                except Exception as parse_error:
                    logger.warning("Failed to parse scholarship", doc_id=doc.id, error=str(parse_error))
                    continue
            
            logger.info("Fetched scholarships", count=len(scholarships))
            return scholarships
        except Exception as e:
            logger.error("Failed to fetch all scholarships", error=str(e))
            raise
    
    async def get_user_matched_scholarships(self, user_id: str) -> List[Scholarship]:
        """Fetch scholarships matched to a specific user"""
        try:
            # Get user's matched scholarship IDs
            doc_ref = self.db.collection('user_matches').document(user_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                logger.info("No matched scholarships found", user_id=user_id)
                return []
            
            matched_ids = doc.to_dict().get('scholarship_ids', [])
            
            # Fetch scholarship details
            scholarships = []
            for scholarship_id in matched_ids:
                scholarship = await self.get_scholarship(scholarship_id)
                if scholarship:
                    scholarships.append(scholarship)
            
            logger.info("Fetched user matched scholarships", user_id=user_id, count=len(scholarships))
            return scholarships
        except Exception as e:
            logger.error("Failed to fetch user matched scholarships", user_id=user_id, error=str(e))
            raise
    
    async def save_user_matches(self, user_id: str, scholarship_ids: List[str]) -> bool:
        """Save matched scholarship IDs for a user"""
        try:
            doc_ref = self.db.collection('user_matches').document(user_id)
            doc_ref.set({
                'scholarship_ids': scholarship_ids,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            logger.info("User matches saved", user_id=user_id, count=len(scholarship_ids))
            return True
        except Exception as e:
            logger.error("Failed to save user matches", user_id=user_id, error=str(e))
            raise
    
    # Saved Scholarships Operations
    async def save_user_scholarship(self, user_id: str, scholarship_id: str) -> bool:
        """Add scholarship to user's saved list"""
        try:
            doc_ref = self.db.collection('users').document(user_id)
            doc_ref.update({
                'saved_scholarships': firestore.ArrayUnion([scholarship_id]),
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            logger.info("Scholarship saved to user favorites", user_id=user_id, scholarship_id=scholarship_id)
            return True
        except Exception as e:
            logger.error("Failed to save scholarship to favorites", user_id=user_id, error=str(e))
            raise
    
    async def unsave_user_scholarship(self, user_id: str, scholarship_id: str) -> bool:
        """Remove scholarship from user's saved list"""
        try:
            doc_ref = self.db.collection('users').document(user_id)
            doc_ref.update({
                'saved_scholarships': firestore.ArrayRemove([scholarship_id]),
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            logger.info("Scholarship removed from user favorites", user_id=user_id, scholarship_id=scholarship_id)
            return True
        except Exception as e:
            logger.error("Failed to remove scholarship from favorites", user_id=user_id, error=str(e))
            raise
    
    # Application Tracking
    async def start_application(self, user_id: str, scholarship_id: str) -> bool:
        """Track that user started an application"""
        try:
            doc_ref = self.db.collection('applications').document()
            doc_ref.set({
                'user_id': user_id,
                'scholarship_id': scholarship_id,
                'status': 'started',
                'progress': {},
                'started_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            logger.info("Application started", user_id=user_id, scholarship_id=scholarship_id)
            return True
        except Exception as e:
            logger.error("Failed to start application", user_id=user_id, error=str(e))
            raise
    
    # Discovery Job Tracking
    async def create_discovery_job(self, user_id: str, job_id: str) -> bool:
        """Create a discovery job record"""
        try:
            doc_ref = self.db.collection('discovery_jobs').document(job_id)
            doc_ref.set({
                'user_id': user_id,
                'status': 'processing',
                'progress': 0,
                'scholarships_found': 0,
                'started_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            logger.info("Discovery job created", job_id=job_id, user_id=user_id)
            return True
        except Exception as e:
            logger.error("Failed to create discovery job", job_id=job_id, error=str(e))
            raise
    
    async def update_discovery_job(self, job_id: str, status: str, progress: float, scholarships_found: int) -> bool:
        """Update discovery job progress"""
        try:
            doc_ref = self.db.collection('discovery_jobs').document(job_id)
            doc_ref.update({
                'status': status,
                'progress': progress,
                'scholarships_found': scholarships_found,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            return True
        except Exception as e:
            logger.error("Failed to update discovery job", job_id=job_id, error=str(e))
            raise
    
    async def get_discovery_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get discovery job status"""
        try:
            doc_ref = self.db.collection('discovery_jobs').document(job_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error("Failed to fetch discovery job", job_id=job_id, error=str(e))
            raise


# Global database instance
db = FirebaseDB()
