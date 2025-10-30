require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/auth", require("./src/routes/auth.routes"));
app.use("/api", require("./src/routes/api.routes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.use((req, res, next) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});