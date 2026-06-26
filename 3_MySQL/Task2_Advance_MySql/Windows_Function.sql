-- Windows Function

-- 1. ROW_NUMBER()

SELECT EmpID, EmpName, Salary,
       ROW_NUMBER() OVER(ORDER BY Salary DESC) AS RoW_Num
FROM Employee;

SELECT EmpID, EmpName, Salary,DeptId,
       ROW_NUMBER() OVER(partition by DeptId Order BY Salary DESC) AS RowNum
FROM Employee;


-- 2. RANK()

SELECT
EmpID,
EmpName,
Salary,
RANK() OVER(ORDER BY Salary DESC) AS Rank_No
FROM Employee;

-- 3. dense_rank()
SELECT
    EmpID,
    EmpName,
    Salary,
    DeptName,
    dense_rank() OVER( order by Salary DESC) AS SalaryRank
FROM Employee e
INNER JOIN Department d
ON e.DeptID = d.DeptID;


-- 4. NTILE(4)
SELECT EmpID,EmpName,Salary,DeptId,
NTILE(4) OVER(Partition By DeptId ORDER BY Salary DESC) AS Salary_Group
FROM Employee;

-- 5. LEAD(Salary) 
SELECT
EmpID,
EmpName,
Salary,
LEAD(Salary) OVER(ORDER BY Salary) AS Next_Salary
FROM Employee;

-- 6. FIRST_VALUE
SELECT
EmpID,
EmpName,
Salary,DeptID,
FIRST_VALUE(Salary) OVER(order by  Salary DESC) AS Highest_Salary
FROM Employee ;


SELECT
    EmpID,
    EmpName,
    DeptID,
    Salary,
    FIRST_VALUE(Salary) OVER (
        PARTITION BY DeptID
        ORDER BY Salary DESC
    ) AS Highest_Salary
FROM Employee;


 -- 7. LAST_VALUE
 
SELECT
    EmpID,
    EmpName,
    DeptID,
    Salary,
    LAST_VALUE(Salary) OVER (
        PARTITION BY DeptID
        ORDER BY Salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS Lowest_Salary
FROM Employee;


-- View

CREATE VIEW EmployeeDepartmentView1 AS
SELECT
e.EmpID,
e.EmpName,
e.Salary,d.deptId,
d.DeptName
FROM Employee e
JOIN Department d
ON e.DeptID=d.DeptID;

SELECT * FROM EmployeeDepartmentView1;


-- Case when
SELECT
EmpID,
EmpName,
Salary,
CASE
WHEN Salary>=40000 THEN 'High Salary'
WHEN Salary>=25000 THEN 'Medium Salary'
ELSE 'Low Salary'
END AS SalaryCategory
FROM Employee;

