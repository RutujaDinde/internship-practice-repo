from flask import Blueprint, render_template,request,jsonify
from marshmallow import ValidationError

from config import db
from models import Role
from schemas import RoleSchema

from routes.auth import roles_required

role_bp = Blueprint( "role",  __name__ , url_prefix="/roles")

role_schema = RoleSchema()
roles_schema = RoleSchema(many=True)

# ---------------------- ROLES PAGE ----------------------

@role_bp.route("/roles-page", methods=["GET"])
def roles_page():
    return render_template("roles.html")

#----------------Create Roles-------------------

@role_bp.route("",methods=["POST"])
@roles_required("Admin")
def add_roles():

    try:

        data=role_schema.load(request.get_json())

    except ValidationError as error:
                return jsonify({
                       "message":"Validation Error",
                        "errors":error.messages
                } )
    
    existing_roles=Role.query.filter_by(
           
           Role_Name=data["Role_Name"]

       ).first()

    if existing_roles:
           return jsonify({
                  "message":"Role already exists"
           }),409

    role=Role(

            Role_Name=data["Role_Name"],
            Description=data.get("Description")
                 
    )

    db.session.add(role)
    db.session.commit()

    return jsonify({
          "success": True,
           "message":"Role added successfully",
            "role": role_schema.dump(role)
        
    }),201

#----------------Get All Roles-------------------

@role_bp.route("",methods=["GET"])
@roles_required("Admin")
def get_roles():

    roles=Role.query.order_by(
        Role.Role_ID.asc()
    ).all()

    return jsonify({

       "roles": roles_schema.dump(roles)
        
    })

#----------------Get Role By ID-------------------

@role_bp.route("/<int:role_id>",methods=["GET"])
@roles_required("Admin")

def get_role(role_id):

    role=db.session.get(Role,role_id)

    if not role:
       return jsonify({
                "message":"Role not found"
        })

    return jsonify({

      "role":role_schema.dump(role)           
                
    })

#----------------Update Role-------------------

@role_bp.route("/<int:role_id>",methods=["PUT"])
@roles_required("Admin")
def update_role(role_id):

    role=db.session.get(Role,role_id)

    try:
        data = role_schema.load( request.get_json(), partial=True )

    except ValidationError as error:
        return jsonify({
            "message": "Validation error",
            "errors": error.messages
        }), 400

    if "Role_Name" in data:

        existing_role = Role.query.filter(
            Role.Role_Name == data["Role_Name"],
            Role.Role_ID != role_id
        ).first()

        if existing_role:
            return jsonify({
                "message": "Role name already exists"
            }), 409

        role.Role_Name = data["Role_Name"]

    if "Description" in data:
        role.Description = data["Description"]

    db.session.commit()

    return jsonify({
        "message": "Role updated successfully",
        "role": role_schema.dump(role)
    }), 200


# ----------------------DELETE ROLE----------------------------

@role_bp.route("/<int:role_id>", methods=["DELETE"])
@roles_required("Admin")
def delete_role(role_id):

    role = db.session.get(Role, role_id)

    if not role:
        return jsonify({
            "message": "Role not found"
        }), 404

    db.session.delete(role)
    db.session.commit()

    return jsonify({
        "message": "Role deleted successfully"
    }), 200








