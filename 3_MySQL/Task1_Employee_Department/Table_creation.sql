use empdb;

CREATE TABLE Department (
    DeptID INT PRIMARY KEY,
    DeptName VARCHAR(50)
);

Create Table Employee(
    EmpID INT,
    EmpName VARCHAR(100),
    Salary DECIMAL(10,2),
    DeptID INT,
    HireDate DATE,
    FOREIGN KEY (DeptID) REFERENCES Department(DeptID)
);


show Tables;

INSERT INTO Department VALUES
(101,'HR'),
(102,'IT'),
(103,'Marketing'),
(104,'Sales');

INSERT INTO Employee VALUES
(1,'Rutuja',30000,101,'2025-8-15'),
(2,'Priyank',35000.50,102,'2026-02-10'),
(3,'Sakshi',40000.75,102,'2025-07-10'),
(4,'Akanksha',22000.00,103,'2026-01-05'),
(5,'Neha',35000.00,102,'2025-10-25'),
(6,'Amruta',18000.00,104,'2025-11-15'),
(7,'Rutuja',25000.00,103,'2025-8-1'),
(8,'Vipul',20000.00,104,'2026-3-5'),
(9,'Prajkta',30000.00,101,'2026-2-15'),
(10,'Raj',32000.00,102,'2026-3-5');

Select*from employee;

Select*from Employee;
Select*from Department;


