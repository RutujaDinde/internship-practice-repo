# Import module
import json
import os
import csv

FILE_NAME="employees.json"

#load data
def load_data() :
    if not os.path.exists(FILE_NAME):
        return []
    
    with open(FILE_NAME,"r") as File:
        return json.load(File)
    
#Save Data
def save_data(data):

    with open(FILE_NAME , "w") as File :
    
         json.dump(data,File,indent=4)


#_Add Employee_

def add_employee():
    employees=load_data()

    emp_id=int(input("Enter Employee ID:"))

    for emp in employees:
        if emp["Emp_ID"]==emp_id:
            print("Employee Already Exists")
            return
    
    name=input("Enter Employee name :")
    email=input("Enter Email :")
    dept=input("Enter Department :")
    salary=input("Enter Salary :")
    hire_date=input("Enter Hire date:")


    emp_data={
        "Emp_ID":emp_id,
        "Emp_Name": name,
        "Email":email,
        "Department":dept,
        "Salary":salary,
        "Hire_Date":hire_date 
    }

    employees.append(emp_data)

    save_data(employees)

    print("Employee added successfully")


#_View Employee_

def view_employee():

    employees=load_data()

    if len(employees) == 0:
        print("No Records Found.")
        return
   
    for emp in employees:
        
        print( )

        print("Employee Id :", emp["Emp_ID"])
        print("Employee Name :", emp["Emp_Name"])
        print("Employee Email :", emp["Email"])
        print("Deapartment :", emp["Department"])
        print("Salary :", emp["Salary"])
        print("Hire_Date :", emp["Hire_Date"])
   

#_Search Employee_

def search_employee():
    employees=load_data()

    emp_id=int(input("Enter Employee Id:"))

    for emp in employees:
         if(emp["Emp_ID"]==emp_id):
            print(emp)
            return
         
    print("Employee Not Found")




#Update Employee
def  update_employee():
    
    employees=load_data()

    emp_id=int(input("Enter Employee ID you want to update :"))

    for emp in employees:
        if(emp["Emp_ID"]==emp_id):

            while True:
                print("\n Field you want to Update- Menu")
                print("1.Name")
                print("2.Email")
                print("3.Department")
                print("4.Salary")
                print("5.Hire_Date")
                print("6.Save and Exit")

                choice=input("Enter Your Choice: ")

                match choice:

                    case "1":
                        emp["Emp_Name"] = input("Enter New Name: ")
                        print("\n Name Updated Successfully.")

                    case "2":
                        emp["Email"] = input("Enter New Email: ")
                        print("Email Updated Successfully.")

                    case "3":
                        emp["Department"] = input("Enter New Department: ")
                        print("Department Updated Successfully.")

                    case "4":
                        emp["Salary"] = float(input("Enter New Salary: "))
                        print("Salary Updated Successfully.")

                    case "5":
                   
                        emp["Hire_Date"] = input("Enter Hire Date: ")
                        print("Hire_date Updated Successfully.")
                
                    case "6":
                        break

            save_data(employees)
            print("Employee Record Updated Successfully.")
            return

    print("Employee Not Found.")
                       

#Delete Employee

def delete_employee():

    employees = load_data()

    emp_id = int(input("Enter Employee ID : "))

    for emp in employees:

        if emp["Emp_ID"] == emp_id:

            employees.remove(emp)

            save_data(employees)

            print("Employee Deleted")

            return

    print("Employee Not Found")
    


#Data Export to csv-To View Records

def export_to_csv():
    employees = load_data()

    if not employees:
        print("No employee records found.")
        return

    with open("employees.csv", "w", newline="") as file:
        writer = csv.writer(file)

        # Header
        writer.writerow(["Emp_ID", "Name", "Email", "Department", "Salary","Hire_Date"])

        # Employee Records
        for emp in employees:
            writer.writerow([
                emp["Emp_ID"],
                emp["Emp_Name"],
                emp["Email"],
                emp["Department"],
                emp["Salary"],
                emp["Hire_Date"]
            ])

    print("Employee records exported successfully to employees.csv")
       

