# Employee Management System(Console Based)

## Description

A console-based Employee Management System developed using **Python** and **MySQL**. The application provides a menu-driven interface to perform CRUD (Create, Read, Update, Delete) operations on employee records while demonstrating database connectivity and core Python concepts.

## Features

* Add Employee
* View Employees
* Search Employee
* Update Employee
* Delete Employee

## Technologies Used

* Python
* MySQL
* mysql-connector-python
* python-dotenv

## Project Structure

* **main.py** – Menu-driven application.
* **Employee.py** – CRUD operations and validations.
* **db.py** – MySQL database connection.
* **employee_schema.sql** – Database and table creation script.
* **requirements.txt** – Project dependencies.
* **.env.example** – Sample environment variables.
* **.gitignore** – Excludes sensitive and temporary files.

## Setup

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
2. Create a `.env` file using `.env.example`.
3. Import `employee_schema.sql` into MySQL.
4. Run the application:

   ```bash
   python main.py
   ```

## Author

**Rutuja Dinde**
