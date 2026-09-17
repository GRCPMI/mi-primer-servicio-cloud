const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

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

// Ruta de la API de productos
app.get("/api/productos", (req, res) => {
    const productos = [
        {
            id: 1, 
            nombre: "Laptop",
            precio: 350,
            categoria: "Accesorios"
        },
        {
            id: 2,
            nombre: "Teclado",
            precio: 700,
            categoria: "Accesorios"
        }
    ];
    res.json(productos);
});

// Iniciar servidor (Siempre al final)
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});