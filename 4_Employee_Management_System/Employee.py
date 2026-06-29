from db import connect_db
import re


#Add Employee
def add_employee():
    try:
        conn=connect_db()
        cursor=conn.cursor()
        
        name=input("Enter employee Name :")
        department=input("Enter Department :")
        salary=int(input("salary :"))
        email=input("Enter Email :")
        hire_date = input("Enter Hire Date : ")

        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

        if not re.match(pattern, email):
            raise ValueError("Invalid Email")

    
        query="Insert into employee_db.employee (Emp_Name,Department,Salary,Email,HireDate) values(%s,%s,%s,%s,%s)"
        values= (name,department,salary,email,hire_date)
        cursor.execute(query,values)
        conn.commit()
        print("employee Added Successfully!")

    except ValueError as e:
        print(e)

    except Exception as e:
        print("Error :",e)

    finally:
        cursor.close()
        conn.close()
    

#View Employee    
def view_employee():
    try:
        conn=connect_db()
        cursor=conn.cursor()
            
        query="Select*from employee"
        cursor.execute(query)
        records=cursor.fetchall()

        if not records:
            print("no employee records found")
        else:
            for data in records:
                print(data)

    except Exception as e:

        print(e)

    finally:

        cursor.close()
        conn.close()   
        
#Update Employee
def update_employee():

    try:
        conn = connect_db()
        cursor = conn.cursor()

        emp_id=int(input("Enter  Employee Id you want to update"))

        cursor=conn.cursor()
        cursor.execute("SELECT* from Employee where Emp_id=%s",(emp_id,))
        data=cursor.fetchone()

        if not data:
            print("Employee Id not Found")
    
        print("1. Name")
        print("2. Department")
        print("3. Salary")
        print("4. Email")
        print("5. Hire Date")

        choice = int(input("Enter your choice: "))

        if choice == 1:
            name = input("Enter New Name: ")
            query = "UPDATE employee_db.employee SET Emp_Name=%s WHERE Emp_ID=%s"
            cursor.execute(query, (name, emp_id))
           

        elif choice == 2:
            dept = input("Enter New Department: ")
            query = "UPDATE employee_db.employee SET Department=%s WHERE Emp_ID=%s"
            cursor.execute(query, (dept, emp_id))
           

        elif choice == 3:
            salary = float(input("Enter New Salary: "))
            query = "UPDATE employee_db.employee SET Salary=%s WHERE Emp_ID=%s"
            cursor.execute(query, (salary, emp_id))
           

        elif choice == 4:
            email = input("Enter New Email: ")
            query = "UPDATE employee_db.employee SET Email=%s WHERE Emp_ID=%s"
            cursor.execute(query, (email, emp_id))
           

        elif choice == 5:
            hire_date= input("Enter Hire Date: ")
            query = "UPDATE employee_db.employee SET HireDate=%s WHERE Emp_ID=%s"
            cursor.execute(query, (hire_date, emp_id))
           

        else:
            print("Invalid Choice")

        conn.commit()
        print("Employee Updated Successfully")

    except ValueError:

        print("Invalid Input")

    except Exception as e:

        print(e)

    finally:
        cursor.close()
        conn.close()
            

    
#Search Employee
def search_employee():
    try:  
        conn=connect_db()
        cursor=conn.cursor()

        emp_id = int(input("Enter Employee ID : "))
        cursor.execute("select*from employee_db.employee where Emp_ID=%s",(emp_id,))
        record = cursor.fetchone()
            
        if record:
            print(record)
        else:
                print("employee Not Found")

    except ValueError:
        print("Employee ID must be numeric")

    except Exception as e:

        print(e)

    finally:
            cursor.close()
            conn.close()

#Delete Employee
def delete_employee():
    
    try:
        conn=connect_db()
        cursor=conn.cursor()

        emp_id = int(input("Enter Employee ID : "))
        cursor.execute("DELETE from employee_db.employee where Emp_ID=%s", (emp_id,))
        conn.commit()
        if cursor.rowcount > 0:
            print("Employee Deleted Successfully")

        else:
            print("Employee ID Not Found")

    except ValueError:

        print("Employee ID must be numeric")

    except Exception as e:

        print(e)

    finally:
        cursor.close()
        conn.close()
            
            
                


