# purpose: set up the sqlalchemy base and sessionmaker for the database and create a dependency that gives each request a clean database session

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from ..core.config import settings
# create a sqlalchemy engine which manages the DB connection pool
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

#  factory that creates new Session objects
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# base class for ORM models that table classes will inherit from
class Base(DeclarativeBase):
    pass 

# dependency that provides a new database session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
