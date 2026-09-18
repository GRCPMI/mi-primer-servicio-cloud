const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// URL de tu aplicación web de Google Apps Script
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzOPwuTFbiNeur3p17cYuDe79l5-PBDjUWPmlW28rJCmTqoROymh917m9ErOCShM1Q1Xg/exec";

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta principal /
app.get("/", (req, res) => {
    res.json({
        mensaje: "Mi primer servicio Cloud",
        estado: "Online",
        tecnologia: "Node.js + Express"
    });
});

// Reto 3: Ruta para consultar el estado del servicio
app.get("/api/estado", (req, res) => {
    res.json({
        estado: "Online",
        servidor: "Node.js",
        servicio: "Cloud API",
        version: "1.0"
    });
});

// Ruta de la API de productos conectada dinámicamente a Google Sheets
app.get("/api/productos", async (req, res) => {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL);
        const productos = await response.json();
        res.json(productos);
    } catch (error) {
        console.error("Error al obtener datos de Google Sheets:", error);
        res.status(500).json({ error: "No se pudieron obtener los productos." });
    }
});

// Iniciar servidor (Siempre al final)
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});