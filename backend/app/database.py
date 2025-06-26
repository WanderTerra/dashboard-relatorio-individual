from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# MySQL connection details - these should be set in your .env file
db_url = (
    f"mysql+pymysql://{os.getenv('DB_USER', 'user_automacao')}:{os.getenv('DB_PASS', 'G5T82ZWMr')}"
    f"@{os.getenv('DB_HOST', '10.100.10.57')}:{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'vonix')}"
    "?charset=utf8mb4"
)

engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    """Dependency para obter sessão do banco"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
