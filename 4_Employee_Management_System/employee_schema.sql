CREATE DATABASE `employee_db`;

CREATE TABLE `employee` (
  `Emp_Id` int NOT NULL AUTO_INCREMENT,
  `Emp_Name` varchar(45) NOT NULL,
  `Department` varchar(45) NOT NULL,
  `Salary` decimal(10,2) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `HireDate` date NOT NULL,
  PRIMARY KEY (`Emp_Id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


select*from employee;
