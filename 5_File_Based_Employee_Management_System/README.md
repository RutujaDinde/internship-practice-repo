# File-Based Employee Management System

A console-based Employee Management System developed in Python that performs CRUD (Create, Read, Update, Delete) operations using **JSON** for file-based storage. The application also supports exporting employee records to **CSV**.

## Features

* Add Employee
* View Employees
* Search Employee
* Update Employee
* Delete Employee
* Export Employees to CSV

## Technologies Used

* Python
* JSON
* CSV
* File Handling

## Project Files

* **main.py** – Contains the menu-driven interface and manages user interactions.
* **employee.py** – Implements CRUD operations and handles employee data processing.
* **employees.json** – Stores employee records in JSON format.
* **employees.csv** – Generated using the **Export Employees to CSV** feature.
* **README.md** – Project documentation.

## How to Run

1. Clone or download the repository.
2. Open the project folder.
3. Run the application:

```bash
python main.py
```

4. Use the menu to manage employee records.
5. Select **Export Employees to CSV** to generate `employees.csv`.

## Note

* `employees.json` is the primary storage file.
* `employees.csv` is created or updated when the **Export Employees to CSV** option is selected.
* To start with an empty dataset, keep `employees.json` as:

```json
[]
```

## Concepts Covered

* File Handling
* JSON Handling
* CSV Handling
* Functions
* Lists & Dictionaries
* Exception Handling
* CRUD Operations

## Author

**Rutuja Dinde**
