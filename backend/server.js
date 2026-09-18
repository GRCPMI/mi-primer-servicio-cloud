const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;

// URL de tu aplicación web de Google Apps Script
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzOPwuTFbiNeur3p17cYuDe79l5-PBDjUWPmlW28rJCmTqoROymh917m9ErOCShM1Q1Xg/exec";

// Middlewares
app.use(cors());
app.use(express.json());

// Función auxiliar para realizar peticiones HTTPS siguiendo redirecciones (302)
function fetchGoogleSheets(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Si Google responde con una redirección (301 o 302), la seguimos
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchGoogleSheets(res.headers.location));
      }

      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject("Error al parsear el JSON de Google Sheets");
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

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

// Ruta de la API de productos conectada a Google Sheets
app.get("/api/productos", async (req, res) => {
  try {
    const productos = await fetchGoogleSheets(GOOGLE_SHEETS_URL);
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "No se pudieron obtener los productos." });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});