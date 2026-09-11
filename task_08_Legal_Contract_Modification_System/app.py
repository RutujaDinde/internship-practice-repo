from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

from config import Config, db

from routes.role_routes import role_bp
from routes.user_routes import user_bp
from routes.contracts_routes import contract_bp
from routes.document_routes import document_bp
from routes.contract_types import contract_type_bp
from routes.contract_status_route import contract_status_bp
from  routes.contract_version import version_bp
from routes.clauses_routes import clause_bp
from routes.modification_routes import modification_bp



app = Flask(__name__)


from flask_jwt_extended import verify_jwt_in_request, get_jwt

@app.context_processor
def inject_current_role():

    try:

        verify_jwt_in_request(optional=True)

        claims = get_jwt()

        return {
            "current_role": claims.get("role")
        }

    except Exception:

        return {
            "current_role": None
        }

# Load configuration
app.config.from_object(Config)

# Initialize database
db.init_app(app)

jwt = JWTManager(app)


# Create tables
migrate = Migrate(app, db)


# Register blueprints
app.register_blueprint(role_bp)
app.register_blueprint(user_bp)
app.register_blueprint(contract_type_bp)
app.register_blueprint(contract_bp)
app.register_blueprint(document_bp)
app.register_blueprint(contract_status_bp)
app.register_blueprint(version_bp)
app.register_blueprint(clause_bp)
app.register_blueprint(modification_bp)





if __name__ == "__main__":
    app.run(debug=True)