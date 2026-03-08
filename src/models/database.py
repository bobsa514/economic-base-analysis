from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

Base = declarative_base()

class County(Base):
    __tablename__ = 'counties'
    
    fips = Column(String(5), primary_key=True)
    county_name = Column(String)
    state_name = Column(String)
    full_name = Column(String)

class NAICSData(Base):
    __tablename__ = 'naics_data'
    
    id = Column(Integer, primary_key=True)
    fips = Column(String(5), ForeignKey('counties.fips'))
    naics = Column(String(6))
    digit = Column(Integer)
    emp_co = Column(Integer)
    emp_us = Column(Integer)
    description = Column(String)
    location_quotient = Column(Float)

def init_db():
    """Initialize the database and create tables"""
    db_path = os.path.join('data', 'processed', 'eba.db')
    engine = create_engine(f'sqlite:///{db_path}')
    Base.metadata.create_all(engine)
    return engine

def get_session():
    """Get a database session"""
    engine = init_db()
    Session = sessionmaker(bind=engine)
    return Session() 