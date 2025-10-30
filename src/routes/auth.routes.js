const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const pool = require("../../db");
const { signAccessToken, verifyRefreshToken, signRefreshToken } = require("../utils/tokens");
const { authenticateJWT } = require("../middlewares/auth.middleware");

router.post(
    "/register",
    body("email").isEmail().withMessage("Formato de email incorrecto"),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role } = req.body;

        try {
            const [exist] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
            if (exist.length) {
                return res.status(409).json({ error: "Email ya registrado" });
            }

            const hash = await bcrypt.hash(password, 10);

            const rol = role === "admin" ? "admin" : "user";

            const [result] = await pool.query(
                "INSERT INTO usuarios (email, password_hash, role) VALUES (?, ?, ?)",
                [email, hash, rol]
            );

            const token = signAccessToken({ id: result.insertId, email, role: rol });

            res.status(201).json({ message: "Usuario registrado", token });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
);

router.post(
    "/login",
    body("email").isEmail().withMessage("Formato de email incorrecto"),
    body("password").notEmpty().withMessage("La contraseña es requerida"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
            const user = rows[0];

            if (!user) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }

            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            if (!passwordMatch) {
                return res.status(401).json({ error: "Contraseña incorrecta" });
            }

            const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
            const refreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role });

            res.json({ accessToken, refreshToken, role: user.role });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error interno del servidor" });
        }

    }
);

router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh Token requerido" });
    }

    try {
        const payload = verifyRefreshToken(refreshToken);

        const newAccessToken = signAccessToken({
            id: payload.id,
            email: payload.email,
            role: payload.role
        });

        res.json({ accessToken: newAccessToken });

    } catch (err) {
        res.status(401).json({ error: "Refresh Token inválido o expirado" });
    }
});

router.post(
    "/password",
    authenticateJWT, 
    body("currentPassword").notEmpty().withMessage("Contraseña actual requerida"),
    body("newPassword").isLength({ min: 6 }).withMessage("La nueva contraseña debe tener al menos 6 caracteres"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; 

        try {
            const [rows] = await pool.query("SELECT password_hash FROM usuarios WHERE id = ?", [userId]);
            const user = rows[0];

            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

            if (!passwordMatch) {
                return res.status(401).json({ error: "Contraseña actual incorrecta" });
            }

            const newHash = await bcrypt.hash(newPassword, 10);

            await pool.query("UPDATE usuarios SET password_hash = ? WHERE id = ?", [newHash, userId]);

            res.json({ message: "Contraseña actualizada exitosamente" });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
);

module.exports = router;