const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;

// URL de tu aplicación web de Google Apps Script
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzaDiTptU-LN9b5OysFbGUgVI2yWYDGphs_3_ENvy04ggWSIjscwf4e1_2QSR4o0JayLQ/exec";

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
    res.json({ mensaje: "Producto actualizado con éxito", respuestaCloud: resultado });
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
    res.json({ mensaje: "Producto eliminado con éxito", respuestaCloud: resultado });
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

// ====================================================
// 🤖 RUTA PARA EL ASISTENTE CON IA (REINTENTO MULTIMODELO)
// ====================================================
app.post("/api/asistente", async (req, res) => {
  const { pregunta, presupuesto, categoria, necesidad } = req.body;

  if (!pregunta) {
    return res.status(400).json({ error: "Escribe una pregunta antes de continuar." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY no está configurada.");
    return res.status(500).json({ error: "El servicio de IA no está configurado correctamente en el servidor." });
  }

  try {
    // 1. Obtener los productos desde Google Sheets
    const productos = await fetchGoogleSheets(`${GOOGLE_SHEETS_URL}?tipo=productos`);

    // 2. Formatear el catálogo
    const catalogoTexto = Array.isArray(productos) && productos.length > 0
      ? productos.map(p => `- ID: ${p.id} | Producto: ${p.nombre} | Precio: $${p.precio} | Categoría: ${p.categoria} | Stock: ${p.stock !== undefined ? p.stock : 'N/A'}`).join("\n")
      : "No hay productos disponibles actualmente en el catálogo.";

    // 3. Prompt Estructurado
    const promptEstructurado = `
Eres un asistente virtual experto de ventas para la tienda "Mi Primer Servicio Cloud".
Tu objetivo es responder la duda del cliente utilizando ÚNICAMENTE la información del siguiente catálogo de productos.

REGLAS OBLIGATORIAS:
1. Responde de manera profesional, amable y concisa.
2. Básate EXCLUSIVAMENTE en el catálogo proporcionado. NO inventes productos, precios ni especificaciones.
3. Si el usuario pregunta por un producto que no existe en el catálogo, indícalo claramente con amabilidad.
4. Si el usuario proporciona un presupuesto o necesidad, recomiéndale la mejor opción dentro del catálogo que cumpla con los criterios.

CATÁLOGO ACTUAL DE PRODUCTOS:
${catalogoTexto}

DATOS ADICIONALES DE LA CONSULTA DEL USUARIO:
${presupuesto ? `- Presupuesto Máximo: $${presupuesto}` : ''}
${categoria && categoria !== 'Todas' ? `- Categoría preferida: ${categoria}` : ''}
${necesidad ? `- Necesidad/Uso principal: ${necesidad}` : ''}

PREGUNTA DEL CLIENTE:
"${pregunta}"
`;

    // 4. Probar secuencialmente con varios modelos para evitar caídas por saturación
    const modelosDisponibles = [
      "gemini-3.8-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];

    let respuestaTexto = null;
    let ultimoError = "";

    for (const modelo of modelosDisponibles) {
      try {
        const urlGemini = `https://generativelanguage.googleapis.com/v1/models/${modelo}:generateContent?key=${apiKey}`;

        const responseIA = await fetch(urlGemini, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptEstructurado }] }]
          })
        });

        const dataIA = await responseIA.json();

        if (responseIA.ok && dataIA.candidates?.[0]?.content?.parts?.[0]?.text) {
          respuestaTexto = dataIA.candidates[0].content.parts[0].text;
          break; // Éxito: Salir del bucle
        } else {
          ultimoError = dataIA.error?.message || `Error con modelo ${modelo}`;
          console.warn(`El modelo ${modelo} falló o está saturado:`, ultimoError);
        }
      } catch (e) {
        ultimoError = e.message;
        console.warn(`Error al conectar con ${modelo}:`, e.message);
      }
    }

    if (!respuestaTexto) {
      throw new Error(ultimoError || "Alta demanda en los servidores de IA. Por favor intenta de nuevo.");
    }

    res.json({
      respuesta: respuestaTexto,
      productosConsultados: Array.isArray(productos) ? productos.length : 0
    });

  } catch (error) {
    console.error("Error en /api/asistente:", error.message);
    res.status(500).json({ error: `El asistente no pudo procesar la solicitud: ${error.message}` });
  }
});

// Exportar para Vercel Serverless & Escucha local
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose localmente en el puerto ${PORT}`);
  });
}

module.exports = app;