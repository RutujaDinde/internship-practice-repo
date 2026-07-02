from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app=Flask(__name__)

# Replace <your_password> with your MySQL password before running
app.config["SQLALCHEMY_DATABASE_URI"] = \
    "mysql+mysqlconnector://root:<your_password>@localhost/employee_rest_db"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)