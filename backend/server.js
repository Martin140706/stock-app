const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// 👉 FRONTEND (esto es lo nuevo)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Base de datos
const dbPath = path.join(__dirname, 'database.db');
console.log('Usando base de datos en:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos', err);
  } else {
    console.log('Base de datos conectada');
  }
});

// Crear tablas si no existen
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      codigo_interno TEXT,
      codigo_barras TEXT,
      precio_venta REAL,
      precio_compra REAL,
      stock INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      fecha TEXT,
      total REAL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pedido_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER,
      producto_id INTEGER,
      cantidad INTEGER,
      precio REAL,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    )
  `);
});

// ======================
// RUTAS API
// ======================

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

// Obtener todos los productos
app.get('/api/productos', (req, res) => {
  db.all('SELECT * FROM productos', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Crear un producto
app.post('/api/productos', (req, res) => {
  const {
    nombre,
    descripcion,
    codigo_interno,
    codigo_barras,
    precio_venta,
    precio_compra,
    stock,
  } = req.body;

  const sql = `
    INSERT INTO productos
    (nombre, descripcion, codigo_interno, codigo_barras, precio_venta, precio_compra, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      nombre,
      descripcion,
      codigo_interno,
      codigo_barras,
      precio_venta,
      precio_compra,
      stock,
    ],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID });
      }
    },
  );
});

// Actualizar stock de un producto
app.put('/api/productos/:id/stock', (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const sql = `UPDATE productos SET stock = ? WHERE id = ?`;

  db.run(sql, [stock, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

// ======================
// RUTA WEB (pantalla)
// ======================

// 👉 cuando entrás a http://localhost:3000

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
