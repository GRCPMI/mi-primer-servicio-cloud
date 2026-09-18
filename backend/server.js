const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

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

// Ruta de la API de productos (Reto 4: Incluye productos adicionales)
app.get("/api/productos", (req, res) => {
    const productos = [
        {
            id: 1, 
            nombre: "Laptop",
            precio: 15000,
            categoria: "Computadoras"
        },
        {
            id: 2,
            nombre: "Mouse",
            precio: 350,
            categoria: "Accesorios"
        },
        {
            id: 3,
            nombre: "Teclado",
            precio: 700,
            categoria: "Accesorios"
        },
        {
            id: 4,
            nombre: "Router",
            precio: 1200,
            categoria: "Redes"
        },
        {
            id: 5,
            nombre: "Disco SSD",
            precio: 1800,
            categoria: "Almacenamiento"
        }
    ];
    res.json(productos);
});

// Iniciar servidor (Siempre al final)
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});