from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import pymysql

pymysql.install_as_MySQLdb()

app = Flask(__name__)

# Replace <your password> with your MySQL password
app.config["SQLALCHEMY_DATABASE_URI"] = \
    "mysql+pymysql://root:<your password>@127.0.0.1:3306/employee_rest_db"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)