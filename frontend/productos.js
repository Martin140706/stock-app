const API_URL = 'http://localhost:3000/api';

let productoSeleccionado = null;

const btnAgregar = document.getElementById('btnAgregar');
const formulario = document.getElementById('formulario');
const btnGuardar = document.getElementById('guardar');
const lista = document.getElementById('listaProductos');

const detalle = document.getElementById('detalle');
const detalleInfo = document.getElementById('detalleInfo');
const cantidadStock = document.getElementById('cantidadStock');

const btnEscanear = document.getElementById('btnEscanear');
const video = document.getElementById('video');
const inputCodigoBarras = document.getElementById('codigoBarras');

let stream = null;
let detector = null;

btnAgregar.onclick = () => {
  formulario.classList.toggle('oculto');
};

btnGuardar.onclick = async () => {
  const producto = {
    nombre: document.getElementById('nombre').value,
    descripcion: document.getElementById('descripcion').value,
    codigo_interno: document.getElementById('codigoInterno').value,
    codigo_barras: document.getElementById('codigoBarras').value,
    precio_venta: document.getElementById('precioVenta').value,
    precio_compra: document.getElementById('precioCompra').value,
    stock: document.getElementById('stock').value,
  };

  await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });

  formulario.classList.add('oculto');
  cargarProductos();
};

async function cargarProductos() {
  const res = await fetch(`${API_URL}/productos`);
  const productos = await res.json();

  lista.innerHTML = '';

  productos.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'producto';
    div.innerHTML = `
      <strong>${p.nombre}</strong><br>
      Stock: ${p.stock} | $${p.precio_venta}
    `;

    div.onclick = () => mostrarDetalle(p);
    lista.appendChild(div);
  });
}

function mostrarDetalle(producto) {
  productoSeleccionado = producto;
  detalle.classList.remove('oculto');

  detalleInfo.innerHTML = `
    <strong>${producto.nombre}</strong><br>
    ${producto.descripcion}<br>
    Código interno: ${producto.codigo_interno}<br>
    Código de barras: ${producto.codigo_barras}<br>
    Precio venta: $${producto.precio_venta}<br>
    Precio compra: $${producto.precio_compra}<br>
    Stock actual: ${producto.stock}
  `;
}

document.getElementById('sumarStock').onclick = () => modificarStock(true);
document.getElementById('restarStock').onclick = () => modificarStock(false);
document.getElementById('cerrarDetalle').onclick = () => {
  detalle.classList.add('oculto');
};

async function modificarStock(sumar) {
  const cantidad = parseInt(cantidadStock.value);
  if (!cantidad || cantidad <= 0) return;

  let nuevoStock = productoSeleccionado.stock;
  nuevoStock = sumar
    ? nuevoStock + cantidad
    : Math.max(0, nuevoStock - cantidad);

  await fetch(`${API_URL}/productos/${productoSeleccionado.id}/stock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock: nuevoStock }),
  });

  detalle.classList.add('oculto');
  cargarProductos();
}
btnEscanear.onclick = async () => {
  if (!('BarcodeDetector' in window)) {
    alert('Tu navegador no soporta escaneo de códigos');
    return;
  }

  detector = new BarcodeDetector({
    formats: ['ean_13', 'code_128', 'qr_code'],
  });

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
  });

  video.srcObject = stream;
  video.classList.remove('oculto');

  scanLoop();
};

async function scanLoop() {
  if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
    requestAnimationFrame(scanLoop);
    return;
  }

  const barcodes = await detector.detect(video);

  if (barcodes.length > 0) {
    inputCodigoBarras.value = barcodes[0].rawValue;
    detenerCamara();
    return;
  }

  requestAnimationFrame(scanLoop);
}

function detenerCamara() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  video.classList.add('oculto');
}

cargarProductos();
