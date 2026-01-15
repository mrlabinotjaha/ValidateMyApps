"""
Script to seed the database with mock data for testing UI
Run with: python create_mock_data.py
"""
import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.app import App, AppStatus
from app.models.image import Image
from app.models.tag import Tag
from app.models.vote import Vote, VoteType
from app.models.comment import Comment
from app.utils.security import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

def create_mock_data():
    db = SessionLocal()
    try:
        # Clear existing data (optional - comment out if you want to keep existing data)
        print("Clearing existing data...")
        db.query(Comment).delete()
        db.query(Vote).delete()
        db.query(Image).delete()
        db.query(AppTag).delete()
        db.query(App).delete()
        db.query(Tag).delete()
        db.query(User).delete()
        db.commit()
        
        # Create test users
        users = []
        
        # Admin user
        admin = User(
            username="admin",
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            full_name="Admin User",
            role=UserRole.admin
        )
        db.add(admin)
        users.append(admin)
        
        # Developer users
        dev1 = User(
            username="alice",
            email="alice@example.com",
            password_hash=get_password_hash("password123"),
            full_name="Alice Developer",
            role=UserRole.developer
        )
        db.add(dev1)
        users.append(dev1)
        
        dev2 = User(
            username="bob",
            email="bob@example.com",
            password_hash=get_password_hash("password123"),
            full_name="Bob Coder",
            role=UserRole.developer
        )
        db.add(dev2)
        users.append(dev2)
        
        # Viewer user
        viewer = User(
            username="viewer1",
            email="viewer@example.com",
            password_hash=get_password_hash("password123"),
            full_name="Viewer User",
            role=UserRole.viewer
        )
        db.add(viewer)
        users.append(viewer)
        
        db.commit()
        
        # Create tags
        tags_data = ["Web App", "Mobile", "API", "Dashboard", "Game", "Tool", "Platform"]
        tags = []
        for tag_name in tags_data:
            tag = Tag(name=tag_name)
            db.add(tag)
            tags.append(tag)
        
        db.commit()
        
        # Create apps
        apps_data = [
            {
                "name": "TaskMaster Pro",
                "short_description": "A powerful task management application with real-time collaboration features.",
                "full_description": "TaskMaster Pro is designed to help teams stay organized and productive. Features include kanban boards, time tracking, team collaboration, and integration with popular tools.",
                "status": AppStatus.beta,
                "is_published": True,
                "creator": dev1,
                "tags": [tags[0], tags[3]]
            },
            {
                "name": "FitTracker Mobile",
                "short_description": "Track your fitness journey with detailed analytics and personalized workout plans.",
                "full_description": "FitTracker Mobile helps you achieve your fitness goals with comprehensive tracking of workouts, nutrition, and progress. Includes social features to share achievements with friends.",
                "status": AppStatus.in_development,
                "is_published": True,
                "creator": dev2,
                "tags": [tags[1], tags[5]]
            },
            {
                "name": "CodeReview Hub",
                "short_description": "Streamline your code review process with AI-powered suggestions and automated checks.",
                "full_description": "CodeReview Hub makes code reviews faster and more efficient. Features include automated code analysis, suggestion engine, team collaboration tools, and integration with Git.",
                "status": AppStatus.completed,
                "is_published": True,
                "creator": dev1,
                "tags": [tags[0], tags[2], tags[3]]
            },
            {
                "name": "PixelQuest",
                "short_description": "An addictive puzzle game with beautiful pixel art graphics and challenging levels.",
                "full_description": "PixelQuest combines classic puzzle mechanics with modern game design. Features 100+ levels, daily challenges, leaderboards, and unlockable achievements.",
                "status": AppStatus.beta,
                "is_published": True,
                "creator": dev2,
                "tags": [tags[1], tags[4]]
            },
            {
                "name": "DataViz Platform",
                "short_description": "Create stunning data visualizations with an intuitive drag-and-drop interface.",
                "full_description": "DataViz Platform makes data visualization accessible to everyone. Import data from multiple sources, choose from 50+ chart types, and share interactive dashboards with your team.",
                "status": AppStatus.in_development,
                "is_published": True,
                "creator": dev1,
                "tags": [tags[0], tags[3], tags[6]]
            },
            {
                "name": "SocialConnect API",
                "short_description": "RESTful API for building social features into your applications.",
                "full_description": "SocialConnect API provides authentication, user profiles, friend connections, activity feeds, and messaging capabilities. Fully documented with SDKs for popular languages.",
                "status": AppStatus.completed,
                "is_published": True,
                "creator": dev2,
                "tags": [tags[2], tags[6]]
            }
        ]
        
        apps = []
        for app_data in apps_data:
            app = App(
                name=app_data["name"],
                short_description=app_data["short_description"],
                full_description=app_data["full_description"],
                status=app_data["status"],
                is_published=app_data["is_published"],
                creator_id=app_data["creator"].id,
                tags=app_data["tags"]
            )
            db.add(app)
            apps.append(app)
        
        db.commit()
        
        # Create placeholder image records
        import random
        placeholder_images = [
            "https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=TaskMaster+Pro",
            "https://via.placeholder.com/800x600/10B981/FFFFFF?text=FitTracker",
            "https://via.placeholder.com/800x600/F59E0B/FFFFFF?text=CodeReview+Hub",
            "https://via.placeholder.com/800x600/EF4444/FFFFFF?text=PixelQuest",
            "https://via.placeholder.com/800x600/8B5CF6/FFFFFF?text=DataViz",
            "https://via.placeholder.com/800x600/EC4899/FFFFFF?text=SocialConnect",
        ]
        
        for idx, app in enumerate(apps):
            # Add 2-3 images per app
            num_images = random.randint(2, 3)
            for i in range(num_images):
                image = Image(
                    app_id=app.id,
                    image_url=placeholder_images[idx % len(placeholder_images)],
                    is_featured=(i == 0),
                    order_index=i
                )
                db.add(image)
        
        db.commit()
        
        # Create votes
        vote_patterns = [
            (apps[0], [dev1, dev2, viewer, admin], [VoteType.upvote, VoteType.upvote, VoteType.upvote, VoteType.upvote]),
            (apps[1], [dev1, viewer], [VoteType.upvote, VoteType.downvote]),
            (apps[2], [dev2, admin], [VoteType.upvote, VoteType.upvote]),
            (apps[3], [dev1, dev2, viewer], [VoteType.upvote, VoteType.upvote, VoteType.upvote]),
            (apps[4], [dev2, admin], [VoteType.upvote, VoteType.downvote]),
            (apps[5], [dev1, dev2, viewer, admin], [VoteType.upvote, VoteType.upvote, VoteType.upvote, VoteType.downvote]),
        ]
        
        for app, voters, vote_types in vote_patterns:
            for voter, vote_type in zip(voters, vote_types):
                vote = Vote(
                    app_id=app.id,
                    user_id=voter.id,
                    vote_type=vote_type
                )
                db.add(vote)
        
        db.commit()
        
        # Create comments
        comments_data = [
            {
                "app": apps[0],
                "user": dev2,
                "content": "This looks amazing! Love the clean UI design.",
                "replies": [
                    {"user": dev1, "content": "Thanks! We spent a lot of time on the UX."}
                ]
            },
            {
                "app": apps[0],
                "user": admin,
                "content": "Great work on the real-time collaboration features. When is the mobile app coming?",
            },
            {
                "app": apps[1],
                "user": dev1,
                "content": "The analytics dashboard is really impressive. How do you handle data sync across devices?",
            },
            {
                "app": apps[2],
                "user": viewer,
                "content": "Just tried this out - it's so much faster than our old code review process!",
            },
            {
                "app": apps[3],
                "user": dev1,
                "content": "The pixel art style is beautiful. How many levels are planned?",
                "replies": [
                    {"user": dev2, "content": "We're planning to release 200+ levels over the next few months!"}
                ]
            },
        ]
        
        for comment_data in comments_data:
            comment = Comment(
                app_id=comment_data["app"].id,
                user_id=comment_data["user"].id,
                content=comment_data["content"]
            )
            db.add(comment)
            db.flush()
            
            # Add replies
            for reply_data in comment_data.get("replies", []):
                reply = Comment(
                    app_id=comment_data["app"].id,
                    user_id=reply_data["user"].id,
                    content=reply_data["content"],
                    parent_comment_id=comment.id
                )
                db.add(reply)
        
        db.commit()
        
        print("✅ Mock data created successfully!")
        print("\nTest Users:")
        print("  - admin / admin123 (Admin)")
        print("  - alice / password123 (Developer)")
        print("  - bob / password123 (Developer)")
        print("  - viewer1 / password123 (Viewer)")
        print(f"\nCreated {len(users)} users, {len(tags)} tags, {len(apps)} apps")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating mock data: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    from app.models.app import AppTag
    create_mock_data()
