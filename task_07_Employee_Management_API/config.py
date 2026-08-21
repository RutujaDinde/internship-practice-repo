import os
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import timedelta
from jwt_config import init_jwt
from flask_mail import Mail

mail = Mail()


load_dotenv()

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{os.getenv('DB_USER')}:"
    f"{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST')}/"
    f"{os.getenv('DB_NAME')}"
)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

# Store JWT in Cookies
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]

# Cookie Names
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"
app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token_cookie"

# Cookie Settings
app.config["JWT_COOKIE_HTTPONLY"] = True
app.config["JWT_COOKIE_SECURE"] = False      # True for HTTPS in production
app.config["JWT_COOKIE_SAMESITE"] = "Lax"

# Token Expiry
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=40)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

# Disable CSRF for development
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

# MAIL CONFIGURATION
# ==========================================================

app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))

app.config["MAIL_USE_TLS"] = (
    os.getenv("MAIL_USE_TLS", "True").lower() == "true"
)

app.config["MAIL_USE_SSL"] = (
    os.getenv("MAIL_USE_SSL", "False").lower() == "true"
)

app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")

app.config["MAIL_DEFAULT_SENDER"] = (
    os.getenv("MAIL_DEFAULT_SENDER_NAME"),
    os.getenv("MAIL_DEFAULT_SENDER_EMAIL")
)

# Initialize Extensions
db = SQLAlchemy(app)

jwt = init_jwt(app)

mail = Mail(app)