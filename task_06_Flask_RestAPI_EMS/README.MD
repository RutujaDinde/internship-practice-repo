# Employee Management REST API

# Employee Management System (Flask REST API)

**Task:** 06 - Flask REST API EMS  
**Date:** 01 July 2026

## Description
A REST API-based Employee Management System built using Flask and SQLAlchemy.

A Flask-based Employee Management REST API built using **Flask**, **MySQL**, and **SQLAlchemy**. The application performs CRUD (Create, Read, Update, Delete) operations and can be tested using **Postman**.

## Technologies Used

* Python
* Flask
* Flask-SQLAlchemy
* MySQL
* Postman

## Features

* Add Employee
* View All Employees
* View Employee by ID
* Update Employee
* Delete Employee

## Project Structure

```text
Employee_Management_REST_API/
│── app.py            # Defines API routes and CRUD operations
│── config.py         # Database configuration and SQLAlchemy setup
│── models.py         # Employee database model
│── requirements.txt  # Project dependencies
│── .gitignore        # Files and folders ignored by Git
│── README.md         # Project documentation
```

## Installation

```bash
git clone <repository-url>
cd Employee_Management_REST_API

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

python app.py
```
## Note

* Before running the project, open `config.py` and replace `<your_password>` with your MySQL password.
* Ensure that the MySQL database specified in `config.py` exists before starting the application.

Test the API using **Postman**.

## Author

**Rutuja Dinde**
