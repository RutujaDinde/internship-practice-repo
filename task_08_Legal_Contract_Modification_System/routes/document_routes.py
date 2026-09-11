from flask import (
    Blueprint,
    render_template,
    request,
    jsonify,
    send_file,
    current_app
)

from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from routes.auth import roles_required
from routes.contracts_routes import ContractUser

from config import db

from models import (
    Document,
    Contract,
    ContractVersion,
    Clause,
    User
)

from schemas import (
    DocumentSchema,
    DocumentUpdateSchema
)

import os
import mimetypes

from uuid import uuid4

from werkzeug.utils import secure_filename


# ============================================================
# BLUEPRINT
# ============================================================

document_bp = Blueprint(
    "documents",
    __name__,
    url_prefix="/documents"
)


# ============================================================
# SCHEMAS
# ============================================================

document_schema = DocumentSchema()
documents_schema = DocumentSchema(many=True)

document_update_schema = DocumentUpdateSchema()


# ============================================================
# ALLOWED FILE TYPES
# ============================================================

ALLOWED_EXTENSIONS = {
    "pdf",
    "docx",
    "txt"
}


# ============================================================
# GET LOGGED-IN USER
# ============================================================

def get_current_user():

    user_id = get_jwt_identity()

    if not user_id:
        return None

    return db.session.get(
        User,
        int(user_id)
    )


# ============================================================
# CHECK FILE EXTENSION
# ============================================================

def allowed_file(filename):

    if not filename:
        return False

    if "." not in filename:
        return False

    extension = filename.rsplit(
        ".",
        1
    )[1].lower()

    return extension in ALLOWED_EXTENSIONS


# ============================================================
# CHECK CONTRACT ACCESS
# ============================================================

def user_can_access_contract(
    user_id,
    contract_id
):

    user = db.session.get(
        User,
        user_id
    )

    if not user or not user.role:
        return False

    role_name = user.role.Role_Name

    # --------------------------------------------------------
    # ADMIN / CONTRACT MANAGER / APPROVER
    # --------------------------------------------------------

    if role_name in [
        "Admin",
        "Contract Manager",
        "Approver"
    ]:
        return True

    # --------------------------------------------------------
    # LEGAL USER
    # --------------------------------------------------------

    if role_name == "Legal User":

        assignment = (
            ContractUser.query
            .filter_by(
                Contract_ID=contract_id,
                User_ID=user_id
            )
            .first()
        )

        return assignment is not None

    return False


# ============================================================
# CHECK DOCUMENT ACCESS
# ============================================================

def user_can_access_document(
    user_id,
    document
):

    if not document:
        return False

    user = db.session.get(
        User,
        user_id
    )

    if not user or not user.role:
        return False

    role_name = user.role.Role_Name

    # --------------------------------------------------------
    # ADMIN / CONTRACT MANAGER / APPROVER
    # --------------------------------------------------------

    if role_name in [
        "Admin",
        "Contract Manager",
        "Approver"
    ]:

        return user_can_access_contract(
            user_id,
            document.Contract_ID
        )

    # --------------------------------------------------------
    # LEGAL USER
    # --------------------------------------------------------

    if role_name == "Legal User":

        # First check contract assignment
        assignment = (
            ContractUser.query
            .filter_by(
                Contract_ID=document.Contract_ID,
                User_ID=user_id
            )
            .first()
        )

        if not assignment:
            return False

        # Get current version
        current_version = (
            ContractVersion.query
            .filter_by(
                Contract_ID=document.Contract_ID,
                Is_Current=True
            )
            .first()
        )

        if not current_version:
            return False

        # Legal User can access only
        # the document belonging to current version
        if current_version.Document_ID != document.Document_ID:
            return False

        return True

    return False


# ============================================================
# DOCUMENT PAGE
# ============================================================

@document_bp.route(
    "/page",
    methods=["GET"]
)
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def documents_page():

    return render_template(
        "documents.html"
    )


# ============================================================
# UPLOAD DOCUMENT
# ONLY CONTRACT MANAGER
#
# IMPORTANT:
# When a new ContractVersion is created,
# clauses from the previous current version
# are copied into the new version.
# ============================================================

@document_bp.route(
    "",
    methods=["POST"]
)
@roles_required(
    "Contract Manager"
)
def create_document():

    saved_file_path = None

    try:

        # ----------------------------------------------------
        # CURRENT USER
        # ----------------------------------------------------

        user_id = int(
            get_jwt_identity()
        )

        user = db.session.get(
            User,
            user_id
        )

        if not user:

            return jsonify({
                "message": "User not found"
            }), 404

        # ----------------------------------------------------
        # CONTRACT ID
        # ----------------------------------------------------

        contract_id = request.form.get(
            "Contract_ID"
        )

        if not contract_id:

            return jsonify({
                "message": "Contract_ID is required"
            }), 400

        try:

            contract_id = int(
                contract_id
            )

        except ValueError:

            return jsonify({
                "message": "Invalid Contract_ID"
            }), 400

        # ----------------------------------------------------
        # CONTRACT
        # ----------------------------------------------------

        contract = db.session.get(
            Contract,
            contract_id
        )

        if not contract:

            return jsonify({
                "message": "Contract not found"
            }), 404

        # ----------------------------------------------------
        # CONTRACT ACCESS
        # ----------------------------------------------------

        if not user_can_access_contract(
            user_id,
            contract_id
        ):

            return jsonify({
                "message":
                "Access denied. You cannot access this contract."
            }), 403

        # ----------------------------------------------------
        # FILE
        # ----------------------------------------------------

        file = request.files.get(
            "file"
        )

        if not file:

            return jsonify({
                "message": "Document file is required"
            }), 400

        if not file.filename:

            return jsonify({
                "message": "Please select a file"
            }), 400

        # ----------------------------------------------------
        # FILE EXTENSION
        # ----------------------------------------------------

        if not allowed_file(
            file.filename
        ):

            return jsonify({
                "message":
                "Invalid file type. Allowed formats: PDF, DOCX, TXT"
            }), 400

        # ----------------------------------------------------
        # SECURE ORIGINAL NAME
        # ----------------------------------------------------

        original_filename = secure_filename(
            file.filename
        )

        if not original_filename:

            return jsonify({
                "message": "Invalid file name"
            }), 400

        # ----------------------------------------------------
        # FILE EXTENSION
        # ----------------------------------------------------

        extension = original_filename.rsplit(
            ".",
            1
        )[1].lower()

        # ----------------------------------------------------
        # UNIQUE FILE NAME
        # ----------------------------------------------------

        unique_filename = (
            f"{uuid4().hex}"
            f".{extension}"
        )

        # ----------------------------------------------------
        # UPLOAD DIRECTORY
        # ----------------------------------------------------

        upload_root = os.path.join(
            current_app.root_path,
            "uploads",
            "contracts",
            str(contract_id)
        )

        os.makedirs(
            upload_root,
            exist_ok=True
        )

        # ----------------------------------------------------
        # COMPLETE FILE PATH
        # ----------------------------------------------------

        saved_file_path = os.path.join(
            upload_root,
            unique_filename
        )

        # ----------------------------------------------------
        # SAVE FILE
        # ----------------------------------------------------

        file.save(
            saved_file_path
        )

        # ----------------------------------------------------
        # DOCUMENT NAME
        # ----------------------------------------------------

        document_name = request.form.get(
            "Document_Name"
        )

        if not document_name:

            document_name = original_filename

        document_name = document_name.strip()

        if not document_name:

            document_name = original_filename

        # ----------------------------------------------------
        # DOCUMENT TYPE
        # ----------------------------------------------------

        document_type = extension.upper()

        # ====================================================
        # GET CURRENT VERSION BEFORE CREATING NEW VERSION
        # ====================================================

        current_version = (
            ContractVersion.query
            .filter_by(
                Contract_ID=contract_id,
                Is_Current=True
            )
            .first()
        )

        # ====================================================
        # GET LATEST VERSION
        # ====================================================

        latest_version = (
            ContractVersion.query
            .filter_by(
                Contract_ID=contract_id
            )
            .order_by(
                ContractVersion.Version_Number.desc()
            )
            .first()
        )

        # ----------------------------------------------------
        # NEXT VERSION NUMBER
        # ----------------------------------------------------

        if latest_version:

            next_version_number = (
                latest_version.Version_Number + 1
            )

        else:

            next_version_number = 1

        # ====================================================
        # GET PREVIOUS VERSION CLAUSES
        #
        # IMPORTANT:
        # We do this BEFORE changing the current version.
        # ====================================================

        previous_clauses = []

        if current_version:

            previous_clauses = (
                Clause.query
                .filter_by(
                    Contract_ID=contract_id,
                    Version_ID=current_version.Version_ID
                )
                .order_by(
                    Clause.Clause_Number.asc()
                )
                .all()
            )

        # ====================================================
        # CREATE DOCUMENT
        # ====================================================

        document = Document(

            Contract_ID=contract_id,

            Document_Name=document_name,

            File_Path=saved_file_path,

            Document_Type=document_type,

            Status="Active",

            Created_By=user_id
        )

        db.session.add(
            document
        )

        # ----------------------------------------------------
        # FLUSH DOCUMENT
        #
        # Document_ID becomes available here.
        # ----------------------------------------------------

        db.session.flush()

        document_id = (
            document.Document_ID
        )

        # ====================================================
        # MAKE OLD VERSION NON-CURRENT
        # ====================================================

        if current_version:

            current_version.Is_Current = False

        # ----------------------------------------------------
        # VERSION CHANGE SUMMARY
        # ----------------------------------------------------

        if next_version_number == 1:

            change_summary = (
                "Initial document uploaded"
            )

        else:

            change_summary = (
                "New document uploaded"
            )

        # ====================================================
        # CREATE NEW VERSION
        # ====================================================

        new_version = ContractVersion(

            Contract_ID=contract_id,

            Document_ID=document_id,

            Version_Number=next_version_number,

            File_Path=saved_file_path,

            Change_Summary=change_summary,

            Created_By=user_id,

            Is_Current=True
        )

        db.session.add(
            new_version
        )

        # ----------------------------------------------------
        # FLUSH VERSION
        #
        # Version_ID becomes available here.
        # ----------------------------------------------------

        db.session.flush()

        # ====================================================
        # COPY PREVIOUS VERSION CLAUSES
        #
        # Only clauses are copied.
        #
        # Modifications are NOT copied.
        # Approvals are NOT copied.
        # ====================================================

        copied_clause_count = 0

        for old_clause in previous_clauses:

            new_clause = Clause(

                Contract_ID=contract_id,

                Version_ID=new_version.Version_ID,

                Clause_Number=old_clause.Clause_Number,

                Clause_Title=old_clause.Clause_Title,

                Clause_Text=old_clause.Clause_Text,

                Created_By=user_id,

                Updated_By=None
            )

            db.session.add(
                new_clause
            )

            copied_clause_count += 1

        # ====================================================
        # COMMIT
        # ====================================================

        db.session.commit()

        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "message":
            "Document uploaded successfully and new version created",

            "document":
            document_schema.dump(
                document
            ),

            "version": {

                "Version_ID":
                new_version.Version_ID,

                "Contract_ID":
                new_version.Contract_ID,

                "Document_ID":
                new_version.Document_ID,

                "Version_Number":
                new_version.Version_Number,

                "File_Path":
                new_version.File_Path,

                "Change_Summary":
                new_version.Change_Summary,

                "Is_Current":
                new_version.Is_Current,

                "Copied_Clauses":
                copied_clause_count
            }

        }), 201

    except ValidationError as error:

        db.session.rollback()

        # ----------------------------------------------------
        # DELETE FILE IF DB FAILED
        # ----------------------------------------------------

        if (
            saved_file_path
            and os.path.exists(
                saved_file_path
            )
        ):

            try:

                os.remove(
                    saved_file_path
                )

            except Exception:
                pass

        return jsonify({

            "message":
            "Validation error",

            "errors":
            error.messages

        }), 400

    except Exception as error:

        db.session.rollback()

        # ----------------------------------------------------
        # DELETE FILE IF DB FAILED
        # ----------------------------------------------------

        if (
            saved_file_path
            and os.path.exists(
                saved_file_path
            )
        ):

            try:

                os.remove(
                    saved_file_path
                )

            except Exception:
                pass

        print(
            "CREATE DOCUMENT ERROR:",
            error
        )

        return jsonify({

            "message":
            "Failed to upload document",

            "error":
            str(error)

        }), 500

# ============================================================
# GET ALL DOCUMENTS
# ============================================================

@document_bp.route(   "", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_documents():

    try:

        # ----------------------------------------------------
        # CURRENT USER
        # ----------------------------------------------------

        current_user_id = int(
            get_jwt_identity()
        )

        user = db.session.get(
            User,
            current_user_id
        )

        if not user:

            return jsonify({
                "message": "User not found"
            }), 404

        role_name = (
            user.role.Role_Name
            if user.role
            else None
        )

        # ----------------------------------------------------
        # BASE QUERY
        # ----------------------------------------------------

        query = Document.query

        # ----------------------------------------------------
        # LEGAL USER
        # ONLY CURRENT VERSION DOCUMENTS
        # ----------------------------------------------------

        if role_name == "Legal User":

            query = (
                query
                .join(
                    ContractUser,
                    ContractUser.Contract_ID
                    ==
                    Document.Contract_ID
                )
                .join(
                    ContractVersion,
                    ContractVersion.Document_ID
                    ==
                    Document.Document_ID
                )
                .filter(
                    ContractUser.User_ID
                    ==
                    current_user_id,

                    ContractVersion.Is_Current
                    == True,

                    Document.Status
                    == "Active"
                )
                .order_by(
                    Document.Document_ID.desc()
                )
            )

        # ----------------------------------------------------
        # OTHER ROLES
        # ----------------------------------------------------

        else:

            query = (
                query
                .order_by(
                    Document.Document_ID.desc()
                )
            )

        documents = query.all()

        return jsonify({

            "success": True,

            "count":
            len(documents),

            "documents":
            documents_schema.dump(documents)

        }), 200

    except Exception as error:

        print(
            "GET DOCUMENTS ERROR:",
            error
        )

        return jsonify({
            "message":
            "Failed to load documents",
            "error": str(error)
        }), 500


# ============================================================
# GET DOCUMENTS BY CONTRACT
# ============================================================

@document_bp.route(
    "/contract/<int:contract_id>",
    methods=["GET"]
)
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_contract_documents(
    contract_id
):

    try:

        # ----------------------------------------------------
        # CURRENT USER
        # ----------------------------------------------------

        user_id = int(
            get_jwt_identity()
        )

        user = db.session.get(
            User,
            user_id
        )

        if not user:

            return jsonify({
                "message": "User not found"
            }), 404

        # ----------------------------------------------------
        # CONTRACT
        # ----------------------------------------------------

        contract = db.session.get(
            Contract,
            contract_id
        )

        if not contract:

            return jsonify({
                "message": "Contract not found"
            }), 404

        # ----------------------------------------------------
        # ACCESS CHECK
        # ----------------------------------------------------

        if not user_can_access_contract(
            user_id,
            contract_id
        ):

            return jsonify({
                "message":
                "Access denied. You are not assigned to this contract."
            }), 403

        role_name = (
            user.role.Role_Name
            if user.role
            else None
        )

        # ----------------------------------------------------
        # LEGAL USER
        # ONLY CURRENT DOCUMENT
        # ----------------------------------------------------

        if role_name == "Legal User":

            current_version = (
                ContractVersion.query
                .filter_by(
                    Contract_ID=contract_id,
                    Is_Current=True
                )
                .first()
            )

            if not current_version:

                return jsonify({

                    "success": True,

                    "contract_id":
                    contract_id,

                    "count": 0,

                    "documents": []

                }), 200

            documents = (
                Document.query
                .filter_by(
                    Document_ID=
                    current_version.Document_ID,

                    Contract_ID=
                    contract_id,

                    Status="Active"
                )
                .all()
            )

        # ----------------------------------------------------
        # ADMIN / CONTRACT MANAGER / APPROVER
        # ALL DOCUMENTS
        # ----------------------------------------------------

        else:

            documents = (
                Document.query
                .filter_by(
                    Contract_ID=contract_id
                )
                .order_by(
                    Document.Document_ID.desc()
                )
                .all()
            )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "contract_id":
            contract_id,

            "count":
            len(documents),

            "documents":
            documents_schema.dump(documents)

        }), 200

    except Exception as error:

        print(
            "GET CONTRACT DOCUMENTS ERROR:",
            error
        )

        return jsonify({
            "message":
            "Failed to load contract documents",
            "error": str(error)
        }), 500


# ============================================================
# GET SINGLE DOCUMENT
# ============================================================

@document_bp.route(
    "/<int:document_id>",
    methods=["GET"]
)
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_document(
    document_id
):

    try:

        user_id = int(
            get_jwt_identity()
        )

        document = db.session.get(
            Document,
            document_id
        )

        if not document:

            return jsonify({
                "message": "Document not found"
            }), 404

        # ----------------------------------------------------
        # ACCESS CHECK
        # ----------------------------------------------------

        if not user_can_access_document(
            user_id,
            document
        ):

            return jsonify({
                "message":
                "Access denied. You cannot access this document."
            }), 403

        return jsonify({

            "success": True,

            "document":
            document_schema.dump(document)

        }), 200

    except Exception as error:

        print(
            "GET DOCUMENT ERROR:",
            error
        )

        return jsonify({
            "message":
            "Failed to load document",
            "error": str(error)
        }), 500


# ============================================================
# VIEW DOCUMENT
# ============================================================

@document_bp.route(
    "/<int:document_id>/view",
    methods=["GET"]
)
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def view_document(
    document_id
):

    try:

        user_id = int(
            get_jwt_identity()
        )

        document = db.session.get(
            Document,
            document_id
        )

        if not document:

            return jsonify({
                "message": "Document not found"
            }), 404

        # ----------------------------------------------------
        # ACCESS CHECK
        # ----------------------------------------------------

        if not user_can_access_document(
            user_id,
            document
        ):

            return jsonify({
                "message":
                "Access denied. You cannot view this document."
            }), 403

        # ----------------------------------------------------
        # FILE CHECK
        # ----------------------------------------------------

        if not os.path.exists(
            document.File_Path
        ):

            return jsonify({
                "message":
                "Document file not found on server"
            }), 404

        # ----------------------------------------------------
        # MIME TYPE
        # ----------------------------------------------------

        mime_type, _ = mimetypes.guess_type(
            document.File_Path
        )

        if not mime_type:

            mime_type = (
                "application/octet-stream"
            )

        # ----------------------------------------------------
        # SEND FILE INLINE
        # ----------------------------------------------------

        response = send_file(
            document.File_Path,
            mimetype=mime_type,
            as_attachment=False
        )

        # ----------------------------------------------------
        # NO CACHE
        # ----------------------------------------------------

        response.headers[
            "Cache-Control"
        ] = (
            "no-store, no-cache, "
            "must-revalidate, max-age=0"
        )

        response.headers[
            "Pragma"
        ] = "no-cache"

        return response

    except Exception as error:

        print(
            "VIEW DOCUMENT ERROR:",
            error
        )

        return jsonify({
            "message":
            "Failed to view document",
            "error": str(error)
        }), 500


# ============================================================
# DOWNLOAD DOCUMENT
# ============================================================

@document_bp.route( "/<int:document_id>/download", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def download_document(
    document_id
):

    try:

        user_id = int(
            get_jwt_identity()
        )

        document = db.session.get(
            Document,
            document_id
        )

        if not document:

            return jsonify({
                "message": "Document not found"
            }), 404

        # ----------------------------------------------------
        # ACCESS CHECK
        # ----------------------------------------------------

        if not user_can_access_document(
            user_id,
            document
        ):

            return jsonify({
                "message":
                "Access denied. You cannot download this document."
            }), 403

        # ----------------------------------------------------
        # FILE CHECK
        # ----------------------------------------------------

        if not os.path.exists(
            document.File_Path
        ):

            return jsonify({
                "message":
                "Document file not found on server"
            }), 404

        # ----------------------------------------------------
        # DOWNLOAD NAME
        # ----------------------------------------------------

        download_name = secure_filename(
            document.Document_Name
        )

        if not download_name:

            download_name = (
                f"document_{document.Document_ID}"
            )

        # Add extension if not already present

        extension = (
            document.Document_Type
            .lower()
        )

        if not download_name.lower().endswith(
            f".{extension}"
        ):

            download_name = (
                f"{download_name}.{extension}"
            )

        # ----------------------------------------------------
        # MIME TYPE
        # ----------------------------------------------------

        mime_type, _ = mimetypes.guess_type(
            document.File_Path
        )

        if not mime_type:

            mime_type = (
                "application/octet-stream"
            )

        # ----------------------------------------------------
        # SEND FILE
        # ----------------------------------------------------

        response = send_file(

            document.File_Path,

            mimetype=mime_type,

            as_attachment=True,

            download_name=download_name
        )

        # ----------------------------------------------------
        # NO CACHE
        # ----------------------------------------------------

        response.headers[
            "Cache-Control"
        ] = (
            "no-store, no-cache, "
            "must-revalidate, max-age=0"
        )

        response.headers[
            "Pragma"
        ] = "no-cache"

        return response

    except Exception as error:

        print(
            "DOWNLOAD DOCUMENT ERROR:",
            error
        )

        return jsonify({
            "message":
            "Failed to download document",
            "error": str(error)
        }), 500


# ============================================================
# UPDATE DOCUMENT
# ONLY CONTRACT MANAGER
# ============================================================

@document_bp.route(
    "/<int:document_id>",
    methods=["PUT"]
)
@roles_required(
    "Contract Manager"
)
def update_document(
    document_id
):

    try:

        user_id = int(
            get_jwt_identity()
        )

        document = db.session.get(
            Document,
            document_id
        )

        if not document:

            return jsonify({
                "message": "Document not found"
            }), 404

        # ----------------------------------------------------
        # CONTRACT ACCESS
        # ----------------------------------------------------

        if not user_can_access_contract(
            user_id,
            document.Contract_ID
        ):

            return jsonify({
                "message":
                "Access denied. You cannot update this document."
            }), 403

        # ----------------------------------------------------
        # REQUEST DATA
        # ----------------------------------------------------

        data = request.get_json()

        if not data:

            return jsonify({
                "message":
                "Request body is required"
            }), 400

        # ----------------------------------------------------
        # VALIDATE
        # ----------------------------------------------------

        try:

            validated_data = (
                document_update_schema
                .load(data, partial=True)
            )

        except ValidationError as error:

            return jsonify({
                "message":
                "Validation error",
                "errors":
                error.messages
            }), 400

        # ----------------------------------------------------
        # UPDATE DOCUMENT NAME
        # ----------------------------------------------------

        if "Document_Name" in validated_data:

            document_name = (
                validated_data["Document_Name"]
                .strip()
            )

            if not document_name:

                return jsonify({
                    "message":
                    "Document_Name cannot be empty"
                }), 400

            document.Document_Name = (
                document_name
            )

        # ----------------------------------------------------
        # UPDATE STATUS
        # ----------------------------------------------------

        if "Status" in validated_data:

            document.Status = (
                validated_data["Status"]
            )

        # ----------------------------------------------------
        # UPDATED BY
        # ----------------------------------------------------

        document.Updated_By = user_id

        # ----------------------------------------------------
        # COMMIT
        # ----------------------------------------------------

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
            "Document updated successfully",

            "document":
            document_schema.dump(document)

        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "UPDATE DOCUMENT ERROR:",
            error
        )

        return jsonify({
            "message":
            "Failed to update document",
            "error": str(error)
        }), 500


# ============================================================
# DELETE DOCUMENT
# ONLY CONTRACT MANAGER
# ============================================================

@document_bp.route(
    "/<int:document_id>",
    methods=["DELETE"]
)
@roles_required(
    "Contract Manager"
)
def delete_document(
    document_id
):

    try:

        user_id = int(
            get_jwt_identity()
        )

        document = db.session.get(
            Document,
            document_id
        )

        if not document:

            return jsonify({
                "message": "Document not found"
            }), 404

        # ----------------------------------------------------
        # CONTRACT ACCESS
        # ----------------------------------------------------

        if not user_can_access_contract(
            user_id,
            document.Contract_ID
        ):

            return jsonify({
                "message":
                "Access denied. You cannot delete this document."
            }), 403

        # ----------------------------------------------------
        # CHECK VERSION HISTORY
        # ----------------------------------------------------

        version_count = (
            ContractVersion.query
            .filter_by(
                Document_ID=document_id
            )
            .count()
        )

        # ----------------------------------------------------
        # DO NOT DELETE DOCUMENT USED BY VERSION
        # ----------------------------------------------------

        if version_count > 0:

            return jsonify({

                "message":
                "Document cannot be deleted because it is linked to version history."

            }), 409

        # ----------------------------------------------------
        # SAVE FILE PATH
        # ----------------------------------------------------

        file_path = document.File_Path

        # ----------------------------------------------------
        # DELETE DATABASE RECORD
        # ----------------------------------------------------

        db.session.delete(
            document
        )

        db.session.commit()

        # ----------------------------------------------------
        # DELETE PHYSICAL FILE
        # ----------------------------------------------------

        if (
            file_path
            and os.path.exists(file_path)
        ):

            try:

                os.remove(
                    file_path
                )

            except Exception as file_error:

                print(
                    "FILE DELETE ERROR:",
                    file_error
                )

        return jsonify({

            "success": True,

            "message":
            "Document deleted successfully"

        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "DELETE DOCUMENT ERROR:",
            error
        )

        return jsonify({
            "message":
            "Failed to delete document",
            "error": str(error)
        }), 500