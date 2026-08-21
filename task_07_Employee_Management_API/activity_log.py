# ==========================================================
# activity_log.py
# ==========================================================

from datetime import datetime
from zoneinfo import ZoneInfo

from flask import request
from flask_jwt_extended import get_jwt_identity

from config import db
from models import Employee, ActivityLog


IST = ZoneInfo("Asia/Kolkata")


# ==========================CREATE ACTIVITY LOG================================

def create_activity_log(
    action,
    module,
    description,
    emp_id=None,
    role_id=None
):

    try:

        # ======================GET LOGGED-IN EMPLOYEE ID============================
        

        if emp_id is None:

            try:
                user_id = get_jwt_identity()
            except Exception:
                user_id = None

            if user_id is not None:
                emp_id = int(user_id)


        # =========================GET ROLE ID FROM EMPLOYEE=========================

        if emp_id is not None and role_id is None:

            employee = db.session.get(
                Employee,
                emp_id
            )

            if employee:

                role_id = employee.Role_ID


        # ======================== CREATE LOG==========================

        log = ActivityLog(

            Emp_ID=emp_id,

            Role_ID=role_id,

            Action=action,

            Module=module,

            Description=description,

            IP_Address=request.remote_addr,

            Created_Date=datetime.now(IST)

        )


        # =======================ADD TO DATABASE===========================

        db.session.add(log)

        return log


    except Exception:

        raise