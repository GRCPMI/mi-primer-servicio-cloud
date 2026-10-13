const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;

// URL de tu aplicación web de Google Apps Script
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzZnposxH_GoTd38PXaQ6__ck4ev_iOKwfW099Ln9O49ie8uR7x_yKltori3WgCC0J4/exec ";

// Middlewares
app.use(cors());
app.use(express.json());

// Función auxiliar para GET a Google Sheets (Maneja redirecciones de Apps Script)
function fetchGoogleSheets(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
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

// Función auxiliar para POST/PUT/DELETE a Google Sheets
function postToGoogleSheets(url, bodyData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(bodyData);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(postToGoogleSheets(res.headers.location, bodyData));
      }

      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ mensaje: "Operación enviada correctamente a Google Sheets" });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

// ----------------------------------------------------
// RUTAS DEL SERVIDOR
// ----------------------------------------------------

// Ruta principal /
app.get("/", (req, res) => {
  res.json({
    mensaje: "Mi primer servicio Cloud",
    estado: "Online",
    tecnologia: "Node.js + Express"
  });
});

// Estado del servicio
app.get("/api/estado", (req, res) => {
  res.json({
    estado: "Online",
    servidor: "Node.js",
    servicio: "Cloud API",
    version: "1.0"
  });
});

// ====================================================
// 🛒 RUTAS PARA PRODUCTOS
// ====================================================

// GET: Consultar productos desde Google Sheets
app.get("/api/productos", async (req, res) => {
  try {
    const productos = await fetchGoogleSheets(`${GOOGLE_SHEETS_URL}?tipo=productos`);
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "No se pudieron obtener los productos." });
  }
});

// POST: Registrar nuevo producto en Google Sheets
app.post("/api/productos", async (req, res) => {
  const { nombre, precio, categoria, stock } = req.body;

  if (!nombre || precio === undefined || !categoria) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    const payload = {
      tipo: "producto",
      accion: "crear",
      nombre,
      precio: Number(precio),
      categoria,
      stock: stock !== undefined ? Number(stock) : 0
    };

    const resultado = await postToGoogleSheets(GOOGLE_SHEETS_URL, payload);
    
    res.status(201).json({
      mensaje: "Producto creado con éxito",
      producto: payload,
      respuestaCloud: resultado
    });
  } catch (error) {
    console.error("Error al registrar producto en Google Sheets:", error);
    res.status(500).json({ error: "Error al guardar el producto en la nube" });
  }
});

// PUT: Actualizar producto en Google Sheets
app.put("/api/productos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria, stock } = req.body;

  try {
    const payload = {
      tipo: "producto",
      accion: "actualizar",
      id: Number(id),
      nombre,
      precio: Number(precio),
      categoria,
      stock: stock !== undefined ? Number(stock) : 0
    };

    const resultado = await postToGoogleSheets(GOOGLE_SHEETS_URL, payload);
    res.json({ mensaje: "Producto actualizado", respuestaCloud: resultado });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error al actualizar el producto en la nube" });
  }
});

// DELETE: Eliminar producto en Google Sheets
app.delete("/api/productos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const payload = {
      tipo: "producto",
      accion: "eliminar",
      id: Number(id)
    };

    const resultado = await postToGoogleSheets(GOOGLE_SHEETS_URL, payload);
    res.json({ mensaje: "Producto eliminado", respuestaCloud: resultado });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ error: "Error al eliminar el producto en la nube" });
  }
});

// ====================================================
// 👤 RUTAS PARA USUARIOS (AUTH Y REGISTRO)
// ====================================================

// GET: Consultar usuarios registrados desde Google Sheets
app.get("/api/usuarios", async (req, res) => {
  try {
    const usuarios = await fetchGoogleSheets(`${GOOGLE_SHEETS_URL}?tipo=usuarios`);
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "No se pudieron obtener los usuarios." });
  }
});

// POST: Registrar nuevo usuario en Google Sheets
app.post("/api/usuarios", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: "Usuario y contraseña obligatorios" });
  }

  try {
    const payload = {
      tipo: "usuario",
      accion: "crear",
      usuario,
      password
    };

    const resultado = await postToGoogleSheets(GOOGLE_SHEETS_URL, payload);
    
    res.status(201).json({
      mensaje: "Usuario registrado con éxito",
      respuestaCloud: resultado
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: "Error al registrar el usuario en la nube" });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});