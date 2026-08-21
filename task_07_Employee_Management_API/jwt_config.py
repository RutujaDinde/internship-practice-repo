from flask_jwt_extended import JWTManager

jwt = JWTManager()

#  blacklist

BLACKLIST = set()


def init_jwt(app):

    jwt.init_app(app)

    # Check revoked token
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):

        return jwt_payload["jti"] in BLACKLIST

    # Revoked token response
    @jwt.revoked_token_loader
    def revoked_token(jwt_header, jwt_payload):

        return {
            "success": False,
            "message": "Token has been revoked."
        }, 401

    # Expired token
    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):

        return {
            "success": False,
            "message": "Token expired."
        }, 401

    # Invalid token
    @jwt.invalid_token_loader
    def invalid_token(error):

        return {
            "success": False,
            "message": "Invalid token."
        }, 401

    # Missing token
    @jwt.unauthorized_loader
    def missing_token(error):

        return {
            "success": False,
            "message": "Authentication required."
        }, 401

    return jwt