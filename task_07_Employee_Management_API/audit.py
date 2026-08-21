
# ==========================audit.py================================


from datetime import datetime
from zoneinfo import ZoneInfo
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import Column, Integer, DateTime

IST = ZoneInfo("Asia/Kolkata")


# ============================AUDIT MIXIN==============================

class AuditMixin:

    CreatedBy = Column( Integer, nullable=True)

    CreatedDate = Column(DateTime, nullable=True )

    UpdatedBy = Column( Integer,nullable=True )

    UpdatedDate = Column(DateTime,nullable=True)


# ==========================CREATE AUDIT================================

def set_created_audit(obj):

    user_id = get_jwt_identity()

    if user_id is not None:
        obj.CreatedBy = int(user_id)
    else:
        obj.CreatedBy = None

    obj.CreatedDate = datetime.now(IST)

    obj.UpdatedBy = None
    obj.UpdatedDate = None


# ==========================UPDATE AUDIT================================

def set_updated_audit(obj):

    user_id = get_jwt_identity()

    if user_id is not None:
        obj.UpdatedBy = int(user_id)
    else:
        obj.UpdatedBy = None

    obj.UpdatedDate = datetime.now(IST)

