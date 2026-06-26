-- Trigger
use empdb;


-- table Employee_Log
CREATE TABLE Employee_Log
(
LogID INT AUTO_INCREMENT PRIMARY KEY,
    EmpID INT,
    EmpName VARCHAR(50),
    ActionPerformed VARCHAR(20),
    ActionTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AFTER INSERT Trigger

DELIMITER //

CREATE TRIGGER after_insert_tri
AFTER INSERT
ON Employee_log_3
FOR EACH ROW
BEGIN
    INSERT INTO Employee_Log(EmpID, EmpName, ActionPerformed)
    VALUES (NEW.EmpID, NEW.EmpName, 'INSERT');
END //

DELIMITER ;



INSERT INTO Employee_log
(EmpID, EmpName,ActionPerformed)
VALUES
(1, 'Rohit','Insert');

SELECT * FROM Employee_Log;

DELIMITER //


-- AFTER UPDATE Trigger

CREATE TRIGGER trg_employeelog_update
AFTER UPDATE ON Employee
FOR EACH ROW
BEGIN
    INSERT INTO Employee_Log (EmpID, EmpName, ActionPerformed)
    VALUES (NEW.EmpID, NEW.EmpName, 'UPDATE');
END //

DELIMITER ;


UPDATE Employee_log
SET EmpName = "Rutuja"
WHERE EmpID = 1;


SELECT * FROM Employee_log;


-- AFTER DELETE Trigger

DELIMITER //

CREATE TRIGGER trg_employee_delete
AFTER DELETE ON Employee
FOR EACH ROW
BEGIN
    INSERT INTO Employee_Log (EmpID, EmpName, ActionPerformed)
    VALUES (OLD.EmpID, OLD.EmpName, 'DELETE');
END //

DELIMITER ;

DELETE FROM Employee
WHERE EmpID = 11;

SELECT * FROM Employee_Log;


