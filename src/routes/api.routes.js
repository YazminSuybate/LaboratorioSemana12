const router = require("express").Router();
const { authenticateJWT, authorizeRoles } = require("../middlewares/auth.middleware");
const pool = require("../../db");

router.get("/me", authenticateJWT, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, email, role, created_at FROM usuarios WHERE id = ?", [req.user.id]);

        if (!rows.length) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener datos del usuario" });
    }
});

router.get("/admin/usuarios", authenticateJWT, authorizeRoles(["admin"]), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, email, role, created_at FROM usuarios");
        res.json({
            admin_role: req.user.role,
            users: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener la lista de usuarios" });
    }
});

module.exports = router;