from functools import wraps

from flask import jsonify

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from config import db
from models import User

BLACKLIST = set()


def roles_required(*required_roles):

    def decorator(func):

        @wraps(func)
        @jwt_required()
        def wrapper(*args, **kwargs):

            # Get User_ID from JWT
            user_id = get_jwt_identity()

            # Get current user from database
            user = db.session.get(
                User,
                int(user_id)
            )

            if not user:

                return jsonify({
                    "message": "User not found"
                }), 404


            # Check user account status
            if user.Status != "Active":

                return jsonify({
                    "message": "User account is inactive"
                }), 403


            # Get current role from database
            if not user.role:

                return jsonify({
                    "message": "User role not found"
                }), 403


            role_name = user.role.Role_Name


            # Check whether user's role is allowed
            if role_name not in required_roles:

                return jsonify({
                    "message": "Access denied. Insufficient permissions."
                }), 403


            # User has permission
            return func(*args, **kwargs)


        return wrapper

    return decorator