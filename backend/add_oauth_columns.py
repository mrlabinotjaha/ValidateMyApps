"""
Migration script to add OAuth columns to the users table.
Run this once with: python add_oauth_columns.py
"""
from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'oauth_provider'
        """))
        if result.fetchone():
            print("OAuth columns already exist, skipping migration.")
            return

        # Add new columns
        print("Adding OAuth columns to users table...")

        # Make password_hash nullable (for OAuth users)
        conn.execute(text("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"))

        # Add OAuth fields
        conn.execute(text("ALTER TABLE users ADD COLUMN oauth_provider VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN oauth_id VARCHAR UNIQUE"))
        conn.execute(text("ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN NOT NULL DEFAULT FALSE"))

        # Create index on oauth_id
        conn.execute(text("CREATE INDEX ix_users_oauth_id ON users (oauth_id)"))

        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
