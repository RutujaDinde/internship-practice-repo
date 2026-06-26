use empdb;
select* From Department;
Select * from Employee;

-- Query 1 . Top 5 highest salary employees
Select EmpName,Salary from Employee order by  Salary desc LIMIT 5;


-- Query 2 Department wise employee count	
select DeptName,count(*) from Department,Employee where employee.DeptID=department.DeptID group by DeptName ;


-- Query 3. Find Second highest salary
Select EmpName ,Salary from Employee order by  Salary DESC LIMIT 1 OFFSET 1;


-- Query 4 Employees whose salary > department average salary

SELECT e.EmpID,
       e.EmpName,
       e.Salary,
       e.DeptID
FROM Employee e
WHERE e.Salary >
(
    SELECT AVG(e2.Salary)
    FROM Employee e2
    WHERE e2.DeptID = e.DeptID
);

 
 -- Query 5 Inner Join
SELECT e.EmpID,e.EmpName,e.Salary,d.DeptName FROM Employee e INNER JOIN Department d ON e.DeptID = d.DeptID;

 -- Query 6 LEFT Join
SELECT e.EmpID,e.EmpName,e.Salary,d.DeptName FROM Employee e LEFT JOIN Department d ON e.DeptID = d.DeptID;


-- Query 7 Group By with Having 
SELECT DeptID,COUNT(*) AS EmployeeCount FROM Employee GROUP BY DeptID HAVING COUNT(*) > 2;


-- Query 8 Employees hired in last 6 months
SELECT * FROM Employee WHERE HireDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH);


-- Query 9 Find the Duplicates records 

SELECT EmpName,COUNT(*) AS DuplicateCount FROM Employee GROUP BY EmpName HAVING COUNT(*) > 1;


-- Query 10 How to remove the duplicates
DELETE e1 FROM Employee e1 INNER JOIN Employee e2
ON e1.EmpName = e2.EmpName
AND e1.Salary = e2.Salary
AND e1.DeptID = e2.DeptID
AND e1.EmpID > e2.EmpID;

