const { verifyToken } = require("../utils/tokens");

function authenticateJWT(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Token ausente o inválido" }); 
    }

    try {
        const userPayload = verifyToken(token);
        req.user = userPayload; 
        next(); 
    } catch (error) {
        return res.status(401).json({ error: "Token expirado o inválido" }); 
    }
}

function authorizeRoles(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "No autorizado" }); 
        }
        next();
    };
}

module.exports = { authenticateJWT, authorizeRoles };