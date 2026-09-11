import os

from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import timedelta


load_dotenv()

db = SQLAlchemy()


class Config:

    SECRET_KEY = os.getenv("SECRET_KEY")

    # JWT Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    JWT_TOKEN_LOCATION = ["cookies"]

    
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=30
    )

    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=7
    )

    JWT_COOKIE_HTTPONLY = True

    JWT_COOKIE_SECURE = False

    JWT_COOKIE_SAMESITE = "Lax"

    JWT_COOKIE_CSRF_PROTECT = False  
    


    # Database Configuration
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")


    SQLALCHEMY_DATABASE_URI = (
        f"postgresql+psycopg://"
        f"{DB_USER}:{DB_PASSWORD}@"
        f"{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False