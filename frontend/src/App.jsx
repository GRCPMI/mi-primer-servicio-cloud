import { useEffect, usestate } from "react";

function App() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("https://mi-primer-servicio-cloud.onrender.com/api/productos")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error en el servidor");
        }
        return response.json();
      })
      .then((data) => {
        setProductos(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setCargando(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", fontFamily: "Arial, sans-serif" }}>
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#2c3e50" }}>Mi Primer Servicio Cloud</h1>
        <p style={{ color: "#7f8c8d" }}>Aplicación React consumiendo una API en Node.js + Express</p>
      </header>

      {cargando && (
        <p style={{ textAlign: "center", color: "#3498db" }}>Cargando información de productos...</p>
      )}

      {error && (
        <div style={{ backgroundColor: "#ffebee", padding: "15px", borderRadius: "8px", border: "1px solid #ef5350", textAlign: "center", color: "#c62828" }}>
          <p>⚠️ No fue posible conectar con el servicio backend.</p>
          <small>Asegúrate de que 'node server.js' esté ejecutándose en el puerto 3000.</small>
        </div>
      )}

      {!cargando && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
          {productos.map((producto) => (
            <div
              key={producto.id}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)"
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>{producto.nombre}</h3>
              <p style={{ margin: "5px 0", fontSize: "1.2rem", fontWeight: "bold", color: "#27ae60" }}>
                ${producto.precio}
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  fontSize: "0.85rem",
                  borderRadius: "15px",
                  backgroundColor: "#f0f4f8",
                  color: "#4a5568",
                  marginTop: "10px"
                }}
              >
                {producto.categoria}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;