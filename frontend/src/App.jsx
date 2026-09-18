import { useEffect, useState } from "react";

function App() {
  // URL base de tu backend en Render
  const API_URL = "https://mi-primer-servicio-cloud.onrender.com";

  // Estados principales
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // Estados para los Retos (Buscador, Filtro y Estado del Servicio)
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [estadoServicio, setEstadoServicio] = useState(null);

  useEffect(() => {
    // Obtener la lista de productos
    fetch(`${API_URL}/api/productos`)
      .then((response) => {
        if (!response.ok) throw new Error("Error en la petición");
        return response.json();
      })
      .then((data) => {
        setProductos(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al cargar productos:", err);
        setError(true);
        setCargando(false);
      });

    // Reto 3: Obtener el estado del servicio desde /api/estado
    fetch(`${API_URL}/api/estado`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener estado");
        return res.json();
      })
      .then((data) => setEstadoServicio(data))
      .catch((err) => console.error("Error al cargar estado del servicio:", err));
  }, [API_URL]);

  // Obtener la lista de categorías únicas de forma dinámica
  const categorias = ["Todas", ...new Set(productos.map((p) => p.categoria))];

  // Filtrado de productos (Reto 1: Búsqueda por nombre | Reto 2: Filtro por categoría)
  const productosFiltrados = productos.filter((producto) => {
    const coincideNombre = producto.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideCategoria =
      categoriaSeleccionada === "Todas" ||
      producto.categoria === categoriaSeleccionada;

    return coincideNombre && coincideCategoria;
  });

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Mi Primer Servicio Cloud</h1>
      <p>Aplicación React consumiendo una API desarrollada con Node.js + Express</p>

      {/* Reto 3: Panel con el Estado del Servicio */}
      {estadoServicio && (
        <div style={{ padding: "12px 20px", background: "#e8f5e9", color: "#2e7d32", borderRadius: "6px", marginBottom: "20px", border: "1px solid #c8e6c9" }}>
          <strong>Estado del Servicio:</strong> {estadoServicio.estado} |{" "}
          <strong>Servidor:</strong> {estadoServicio.servidor} v{estadoServicio.version} |{" "}
          <strong>Servicio:</strong> {estadoServicio.servicio}
        </div>
      )}

      {/* Retos 1 y 2: Controles para Buscar y Filtrar */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ padding: "10px", flex: 1, borderRadius: "5px", border: "1px solid #ccc", fontSize: "14px" }}
        />

        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "14px" }}
        >
          {categorias.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Estados de Carga y Error */}
      {cargando && <p>Cargando información desde el servidor...</p>}
      {error && (
        <p style={{ color: "#d32f2f", backgroundColor: "#ffebee", padding: "10px", borderRadius: "5px" }}>
          No fue posible conectar con el servicio backend.
        </p>
      )}

      {/* Renderizado de la lista de productos filtrados */}
      {!cargando && !error && (
        <div style={{ display: "grid", gap: "15px" }}>
          {productosFiltrados.length === 0 ? (
            <p>No se encontraron productos que coincidan con la búsqueda.</p>
          ) : (
            productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                style={{
                  border: "1px solid #e0e0e0",
                  padding: "15px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>{producto.nombre}</h3>
                <p style={{ margin: "4px 0", color: "#2e7d32", fontWeight: "bold" }}>
                  Precio: ${producto.precio}
                </p>
                <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                  Categoría: <span>{producto.categoria}</span>
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;