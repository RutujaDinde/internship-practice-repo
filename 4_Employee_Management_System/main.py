from Employee import *

while True:

    print("\nEmployee Management System")

    print("1.Add Employee")
    print("2.View Employee")
    print("3.Search Employee")
    print("4.Update Employee")
    print("5.Delete Employee")
    print("6.Exit")

    try:

        choice = int(input("Enter Your Choice: "))

        if choice == 1:
            add_employee()
            input("\nPress Enter to continue...")
            

        elif choice == 2:
            view_employee()
            input("\nPress Enter to continue...")

        elif choice == 3:
            search_employee()
            input("\nPress Enter to continue...")

        elif choice == 4:
            update_employee()
            input("\nPress Enter to continue...")

        elif choice == 5:
            delete_employee()
            input("\nPress Enter to continue...")

        elif choice == 6:
            break

        else:
            print("Invalid Choice")

    except ValueError:
        print("Enter Numbers Only")