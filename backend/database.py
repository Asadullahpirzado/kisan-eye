import os
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.future import select

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./kisan.db")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String)
    image_path = Column(String)
    prediction = Column(String)
    confidence = Column(Float)
    alternatives = Column(JSON)
    answers = Column(JSON)
    risk_level = Column(String)
    risk_score = Column(Float)
    affected_area = Column(Float)
    explanation = Column(String)
    evidence = Column(JSON)
    action_plan = Column(JSON)
    parent_case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def create_case(**kwargs):
    async with async_session() as session:
        new_case = Case(**kwargs)
        session.add(new_case)
        await session.commit()
        await session.refresh(new_case)
        return new_case.id

async def get_case(case_id: int):
    async with async_session() as session:
        result = await session.execute(select(Case).filter(Case.id == case_id))
        case = result.scalar_one_or_none()
        if case:
            return {c.name: getattr(case, c.name) for c in case.__table__.columns}
        return None

async def list_cases():
    async with async_session() as session:
        result = await session.execute(select(Case).order_by(Case.created_at.desc()))
        cases = result.scalars().all()
        return [{c.name: getattr(case, c.name) for c in case.__table__.columns} for case in cases]

async def list_cases_for_crop(crop: str):
    async with async_session() as session:
        result = await session.execute(select(Case).filter(Case.crop == crop).order_by(Case.created_at.desc()))
        cases = result.scalars().all()
        return [{c.name: getattr(case, c.name) for c in case.__table__.columns} for case in cases]
