import { useEffect, useState } from "react";

function App() {
  const API_URL = "https://mi-primer-servicio-cloud-vb64.vercel.app";

  // --- ESTADOS DE AUTENTICACIÓN (LOGIN Y REGISTRO) ---
  const [autenticado, setAutenticado] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);
  const [usuarioInput, setUsuarioInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [mensajeAuth, setMensajeAuth] = useState({ texto: "", tipo: "" });

  const [usuariosRegistrados, setUsuariosRegistrados] = useState([
    { usuario: "admin", password: "123" }
  ]);

  // --- ESTADOS PRINCIPALES DEL SISTEMA ---
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false); // Estado para deshabilitar botón mientras guarda
  const [errorBackend, setErrorBackend] = useState(false);

  // --- ESTADOS DE FILTRADO Y BÚSQUEDA ---
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [estadoServicio, setEstadoServicio] = useState(null);

  // --- ESTADOS DEL FORMULARIO CRUD (POST / PUT) ---
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("");
  const [stock, setStock] = useState("");

  // --- MANEJO DEL LOGIN Y REGISTRO ---
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setMensajeAuth({ texto: "", tipo: "" });

    if (esRegistro) {
      if (passwordInput !== confirmPasswordInput) {
        setMensajeAuth({ texto: "Las contraseñas no coinciden.", tipo: "error" });
        return;
      }

      const existe = usuariosRegistrados.some(u => u.usuario.toLowerCase() === usuarioInput.toLowerCase());
      if (existe) {
        setMensajeAuth({ texto: "El nombre de usuario ya está registrado.", tipo: "error" });
        return;
      }

      setUsuariosRegistrados([...usuariosRegistrados, { usuario: usuarioInput, password: passwordInput }]);
      setMensajeAuth({ texto: "¡Usuario registrado con éxito! Ahora puedes iniciar sesión.", tipo: "exito" });
      setEsRegistro(false);
      setPasswordInput("");
      setConfirmPasswordInput("");
    } else {
      const valido = usuariosRegistrados.some(
        u => u.usuario.toLowerCase() === usuarioInput.toLowerCase() && u.password === passwordInput
      );

      if (valido) {
        setAutenticado(true);
        setMensajeAuth({ texto: "", tipo: "" });
      } else {
        setMensajeAuth({ texto: "Usuario o contraseña incorrectos.", tipo: "error" });
      }
    }
  };

  const handleLogout = () => {
    setAutenticado(false);
    setUsuarioInput("");
    setPasswordInput("");
    setConfirmPasswordInput("");
    setMensajeAuth({ texto: "", tipo: "" });
  };

  // --- CARGAR PRODUCTOS (READ - GET) ---
  const cargarProductos = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/productos`);
      if (!res.ok) throw new Error("Error al obtener productos");
      const data = await res.json();
      setProductos(data);
      setCargando(false);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setErrorBackend(true);
      setCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado) {
      cargarProductos();

      fetch(`${API_URL}/api/estado`)
        .then((res) => res.json())
        .then((data) => setEstadoServicio(data))
        .catch((err) => console.error("Error al cargar estado:", err));
    }
  }, [autenticado]);

  const limpiarFormulario = () => {
    setNombre("");
    setPrecio("");
    setCategoria("");
    setStock("");
    setModoEdicion(false);
    setIdEditar(null);
  };

  // --- CREAR (POST) O ACTUALIZAR (PUT) PRODUCTO ---
  const handleGuardarProducto = async (e) => {
    e.preventDefault();

    if (!nombre || !precio || !categoria) {
      alert("Por favor completa los campos obligatorios: Nombre, Precio y Categoría.");
      return;
    }

    setGuardando(true);

    const productoData = {
      nombre,
      precio: Number(precio),
      categoria,
      stock: stock !== "" ? Number(stock) : 0
    };

    try {
      if (modoEdicion) {
        // PETICIÓN PUT (Actualizar)
        const res = await fetch(`${API_URL}/api/productos/${idEditar}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productoData)
        });

        if (!res.ok) throw new Error("Error al actualizar producto");
      } else {
        // PETICIÓN POST (Crear)
        const res = await fetch(`${API_URL}/api/productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productoData)
        });

        if (!res.ok) throw new Error("Error al crear producto");
      }

      limpiarFormulario();
      await cargarProductos(); // Vuelve a cargar los datos de Google Sheets
    } catch (err) {
      console.error("Error al guardar producto:", err);
      alert("No se pudo guardar el producto. Revisa la conexión con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  // --- PREPARAR EDICIÓN ---
  const handleEditar = (producto) => {
    setModoEdicion(true);
    setIdEditar(producto.id);
    setNombre(producto.nombre);
    setPrecio(producto.precio);
    setCategoria(producto.categoria);
    setStock(producto.stock !== undefined ? producto.stock : 0);
  };

  // --- ELIMINAR PRODUCTO (DELETE) ---
  const handleEliminar = async (id) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto con ID ${id}?`)) {
      try {
        const res = await fetch(`${API_URL}/api/productos/${id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Error al eliminar producto");
        await cargarProductos();
      } catch (err) {
        console.error("Error en DELETE:", err);
        alert("Error al eliminar el producto.");
      }
    }
  };

  // Filtros de categoría y búsqueda
  const categorias = ["Todas", ...new Set(productos.map((p) => p.categoria))];
  const productosFiltrados = productos.filter((producto) => {
    const coincideNombre = producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaSeleccionada === "Todas" || producto.categoria === categoriaSeleccionada;
    return coincideNombre && coincideCategoria;
  });

  // ==========================================
  // 🔐 VISTA 1: MÓDULO DE LOGIN Y REGISTRO
  // ==========================================
  if (!autenticado) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f2f5", fontFamily: "Arial, sans-serif" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "100%", maxWidth: "380px" }}>
          <h2 style={{ textAlign: "center", margin: "0 0 10px 0", color: "#1976d2" }}>SISTEMA CLOUD</h2>
          <p style={{ textAlign: "center", color: "#666", fontSize: "14px", marginBottom: "25px" }}>
            {esRegistro ? "Crear Nueva Cuenta" : "Iniciar Sesión"}
          </p>

          {mensajeAuth.texto && (
            <div style={{
              backgroundColor: mensajeAuth.tipo === "error" ? "#ffebee" : "#e8f5e9",
              color: mensajeAuth.tipo === "error" ? "#c62828" : "#2e7d32",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "15px",
              fontSize: "14px",
              textAlign: "center"
            }}>
              {mensajeAuth.texto}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ fontSize: "14px", color: "#555", display: "block", marginBottom: "5px" }}>Usuario:</label>
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={usuarioInput}
                onChange={(e) => setUsuarioInput(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "14px", color: "#555", display: "block", marginBottom: "5px" }}>Contraseña:</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }}
                required
              />
            </div>

            {esRegistro && (
              <div>
                <label style={{ fontSize: "14px", color: "#555", display: "block", marginBottom: "5px" }}>Confirmar Contraseña:</label>
                <input
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              style={{
                backgroundColor: esRegistro ? "#2e7d32" : "#1976d2",
                color: "#ffffff",
                border: "none",
                padding: "12px",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "15px",
                marginTop: "10px"
              }}
            >
              {esRegistro ? "REGISTRARME" : "INICIAR SESIÓN"}
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
            {esRegistro ? (
              <p style={{ color: "#666" }}>
                ¿Ya tienes una cuenta?{" "}
                <span
                  onClick={() => { setEsRegistro(false); setMensajeAuth({ texto: "", tipo: "" }); }}
                  style={{ color: "#1976d2", cursor: "pointer", fontWeight: "bold" }}
                >
                  Inicia Sesión aquí
                </span>
              </p>
            ) : (
              <p style={{ color: "#666" }}>
                ¿No tienes cuenta?{" "}
                <span
                  onClick={() => { setEsRegistro(true); setMensajeAuth({ texto: "", tipo: "" }); }}
                  style={{ color: "#2e7d32", cursor: "pointer", fontWeight: "bold" }}
                >
                  Regístrate aquí
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🖥️ VISTA 2: MÓDULO PRINCIPAL DEL SISTEMA (CRUD)
  // ==========================================
  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif", maxWidth: "850px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, color: "#1976d2" }}>Mi Primer Servicio Cloud</h1>
          <p style={{ margin: "5px 0 0 0", color: "#666" }}>
            Bienvenido, <strong>{usuarioInput}</strong> | Aplicación React consumiendo API en Render conectada a Google Sheets
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{ backgroundColor: "#d32f2f", color: "white", border: "none", padding: "10px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Panel Estado del Servicio */}
      {estadoServicio && (
        <div style={{ padding: "12px 20px", background: "#e8f5e9", color: "#2e7d32", borderRadius: "6px", marginBottom: "20px", border: "1px solid #c8e6c9" }}>
          <strong>Estado del Servicio:</strong> {estadoServicio.estado} |{" "}
          <strong>Servidor:</strong> {estadoServicio.servidor} v{estadoServicio.version} |{" "}
          <strong>Servicio:</strong> {estadoServicio.servicio}
        </div>
      )}

      {/* Formulario de Creación / Edición */}
      <div style={{ backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "8px", marginBottom: "25px", border: "1px solid #e0e0e0" }}>
        <h2 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>
          {modoEdicion ? `Modificar Producto (ID: ${idEditar})` : "Agregar Nuevo Producto"}
        </h2>
        <form onSubmit={handleGuardarProducto} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input
            type="text"
            placeholder="Nombre del Producto *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
            required
          />
          <input
            type="number"
            placeholder="Precio *"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
            required
          />
          <input
            type="text"
            placeholder="Categoría *"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
            required
          />
          <input
            type="number"
            placeholder="Stock (Cantidad)"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          />

          <div style={{ gridColumn: "span 2", display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={guardando}
              style={{
                backgroundColor: modoEdicion ? "#1976d2" : "#2e7d32",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: guardando ? "not-allowed" : "pointer",
                fontWeight: "bold",
                opacity: guardando ? 0.7 : 1
              }}
            >
              {guardando ? "Guardando en Cloud..." : modoEdicion ? "Guardar Cambios (PUT)" : "Registrar Producto (POST)"}
            </button>
            {modoEdicion && (
              <button
                type="button"
                onClick={limpiarFormulario}
                style={{ backgroundColor: "#757575", color: "white", border: "none", padding: "10px 15px", borderRadius: "5px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Controles para Buscar y Filtrar */}
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
            <option key={idx} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Estados de Carga y Error */}
      {cargando && <p>Cargando información desde el servidor...</p>}
      {errorBackend && (
        <p style={{ color: "#d32f2f", backgroundColor: "#ffebee", padding: "10px", borderRadius: "5px" }}>
          No fue posible conectar con el servicio backend.
        </p>
      )}

      {/* Renderizado de la lista de productos */}
      {!cargando && !errorBackend && (
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
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                    {producto.nombre} <span style={{ fontSize: "12px", color: "#888" }}>(ID: {producto.id})</span>
                  </h3>
                  <p style={{ margin: "4px 0", color: "#2e7d32", fontWeight: "bold" }}>
                    Precio: ${producto.precio} | Stock: {producto.stock !== undefined ? producto.stock : "N/A"}
                  </p>
                  <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                    Categoría: <span>{producto.categoria}</span>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleEditar(producto)}
                    style={{ backgroundColor: "#ff9800", color: "white", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer", fontSize: "13px" }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(producto.id)}
                    style={{ backgroundColor: "#d32f2f", color: "white", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer", fontSize: "13px" }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;