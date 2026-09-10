// ==========================================================
// LSHOP — GOOGLE APPS SCRIPT
// GOOGLE SHEETS → PÁGINA WEB
// ==========================================================

const SPREADSHEET_ID = "";
const LSHOP_API_VERSION = "FASE1_STOCK_M_V3";
const MINUTOS_RESERVA = 60;

const HOJA_PRODUCTOS = "PRODUCTOS";
const HOJA_MOVIMIENTOS = "MOVIMIENTOS";
const HOJA_VENTAS = "VENTAS";
const HOJA_CONFIGURACION = "CONFIGURACION";

// Límites de la API pública. Son suficientemente amplios para compras
// normales, pero evitan que una solicitud anónima reserve inventario de forma
// masiva o agote la ejecución de Apps Script.
const MAX_TAMANO_POST = 20000;
const MAX_LINEAS_POR_PEDIDO = 25;
const MAX_CANTIDAD_POR_SKU = 50;
const MAX_LONGITUD_CLIENTE = 200;
const MAX_LONGITUD_TELEFONO = 80;
const MAX_LONGITUD_DIRECCION = 300;
const MAX_PEDIDOS_PUBLICOS_POR_MINUTO = 60;


// ==========================================================
// GET
// ==========================================================

function doGet(e) {
  try {
    liberarReservasVencidas();

    const accion = e && e.parameter && e.parameter.accion
      ? String(e.parameter.accion).trim()
      : "productos";

    switch (accion) {
      case "verificarPedido":
        return respuestaJSON(verificarPedido(e && e.parameter ? e.parameter.pedido : ""));

      case "productos":
        return respuestaJSON({
          ok: true,
          productos: obtenerProductos()
        });

      case "todo":
        return respuestaJSON({
          ok: true,
          productos: obtenerProductos(),
          configuracion: obtenerConfiguracion()
        });

      case "configuracion":
        return respuestaJSON({
          ok: true,
          configuracion: obtenerConfiguracion()
        });

      default:
        return respuestaJSON({
          ok: false,
          error: "Acción no reconocida: " + accion
        });
    }
  } catch (error) {
    return respuestaJSON({
      ok: false,
      error: error.message || String(error)
    });
  }
}


// ==========================================================
// VERIFICAR PEDIDO REGISTRADO
// ==========================================================

function verificarPedido(pedido) {
  const pedidoBuscado = String(pedido || "").trim();

  if (!pedidoBuscado) {
    return { ok: false, encontrado: false, error: "Número de pedido requerido." };
  }

  if (pedidoBuscado.length > 80) {
    return { ok: false, encontrado: false, error: "Número de pedido inválido." };
  }

  const hojaVentas = obtenerHoja(HOJA_VENTAS);
  const ultimaFila = hojaVentas.getLastRow();

  if (ultimaFila < 2) {
    return { ok: true, encontrado: false, pedido: pedidoBuscado };
  }

  const filas = hojaVentas.getRange(2, 1, ultimaFila - 1, 16).getValues();

  let encontrado = false;
  let total = 0;
  let descuento = 0;
  let lineas = 0;
  let estado = "";

  filas.forEach(fila => {
    if (String(fila[0] || "").trim() !== pedidoBuscado) return;

    encontrado = true;
    lineas += 1;

    // N = Total del pedido
    const totalFila = numero(fila[13]);
    if (totalFila > 0) total = totalFila;

    // M = Descuento
    const descuentoFila = numero(fila[12]);
    if (descuentoFila > 0) descuento = descuentoFila;

    const estadoFila = String(fila[14] || "").trim();
    if (estadoFila) estado = estadoFila;
  });

  return {
    ok: true,
    encontrado,
    pedido: pedidoBuscado,
    total,
    descuento,
    estado,
    lineas
  };
}


// ==========================================================
// POST
// ==========================================================

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respuestaJSON({
        ok: false,
        error: "No se recibieron datos."
      });
    }

    const contenido = e.postData.contents;

    if (contenido.length > MAX_TAMANO_POST) {
      return respuestaJSON({
        ok: false,
        error: "La solicitud excede el tamaño permitido."
      });
    }

    const datos = JSON.parse(contenido);

    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
      return respuestaJSON({
        ok: false,
        error: "La estructura de la solicitud no es válida."
      });
    }
    const accion = String(datos.accion || "").trim();

    switch (accion) {
      case "registrarVenta":
        liberarReservasVencidas();
        return respuestaJSON(registrarVenta(datos));

      // ----------------------------------------------------
      // SEGURIDAD: estas acciones NO deben estar disponibles
      // públicamente desde la tienda.
      // Los movimientos y el stock solo se modifican desde
      // las funciones internas del propio Apps Script.
      // ----------------------------------------------------
      case "movimiento":
      case "actualizarStock":
        return respuestaJSON({
          ok: false,
          error: "Acción no permitida desde la API pública."
        });

      default:
        return respuestaJSON({
          ok: false,
          error: "Acción POST no reconocida."
        });
    }
  } catch (error) {
    return respuestaJSON({
      ok: false,
      error: error.message || String(error)
    });
  }
}


// ==========================================================
// RESPUESTA JSON
// ==========================================================

function respuestaJSON(datos) {
  const respuesta = {
    ...(datos || {}),
    version: LSHOP_API_VERSION
  };

  return ContentService
    .createTextOutput(JSON.stringify(respuesta))
    .setMimeType(ContentService.MimeType.JSON);
}


// ==========================================================
// SPREADSHEET / HOJA
// ==========================================================

function obtenerSpreadsheet() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function obtenerHoja(nombre) {
  const hoja = obtenerSpreadsheet().getSheetByName(nombre);

  if (!hoja) {
    throw new Error('No existe la hoja "' + nombre + '".');
  }

  return hoja;
}


// ==========================================================
// LEER PRODUCTOS
// ==========================================================

function obtenerProductos() {
  const hoja = obtenerHoja(HOJA_PRODUCTOS);
  const ultimaFila = hoja.getLastRow();
  const ultimaColumna = hoja.getLastColumn();

  if (ultimaFila < 2) return [];

  const valores = hoja
    .getRange(1, 1, ultimaFila, ultimaColumna)
    .getDisplayValues();

  const encabezados = valores[0].map(normalizarClave);
  const productos = [];

  valores.slice(1).forEach(fila => {
    const datos = {};

    encabezados.forEach((encabezado, indice) => {
      if (encabezado) datos[encabezado] = fila[indice] || "";
    });

    const activo = String(datos.activo || "")
      .trim()
      .toLowerCase();

    if (activo === "no" || activo === "false" || activo === "0") return;
    if (!datos.id) return;

    productos.push({
      id: numero(datos.id),
      sku: datos.sku || "",
      nombre: datos.nombre || "",
      categoria: datos.categoria || "",
      genero: datos.genero || "",
      tamano: datos.tamano || "",
      precio: numero(datos.precio),
      talla: datos.talla || "",
      color: datos.color || "",
      stockInicial: numero(datos.stock_inicial),
      entradas: numero(datos.entradas),
      salidas: numero(datos.salidas),
      stockActual: numero(datos.stock_actual),
      imagen: datos.imagen || "",
      activo: true
    });
  });

  return productos;
}


// ==========================================================
// NORMALIZAR ENCABEZADOS
// ==========================================================

function normalizarClave(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}


// ==========================================================
// CONVERTIR NÚMERO
// ==========================================================

function numero(valor) {
  if (typeof valor === "number") return valor;

  let texto = String(valor || "").trim();
  if (!texto) return 0;

  texto = texto.replace(/L\s*/gi, "");
  texto = texto.replace(/,/g, "");
  texto = texto.replace(/[^0-9.-]/g, "");

  const numeroConvertido = parseFloat(texto);

  return isNaN(numeroConvertido) ? 0 : numeroConvertido;
}


// ==========================================================
// CONFIGURACIÓN
// ==========================================================

function obtenerConfiguracion() {
  const hoja = obtenerHoja(HOJA_CONFIGURACION);
  const ultimaFila = hoja.getLastRow();
  const ultimaColumna = hoja.getLastColumn();

  if (ultimaFila < 2) return {};

  const valores = hoja
    .getRange(1, 1, ultimaFila, ultimaColumna)
    .getDisplayValues();

  const encabezados = valores[0].map(normalizarClave);
  const configuracion = {};

  valores.slice(1).forEach(fila => {
    const objeto = {};

    encabezados.forEach((encabezado, indice) => {
      if (encabezado) objeto[encabezado] = fila[indice] || "";
    });

    const clave =
      objeto.configuracion ||
      objeto.parametro ||
      objeto.clave ||
      "";

    const valor = objeto.valor || "";

    if (clave) {
      configuracion[normalizarClave(clave)] = valor;
    }
  });

  return configuracion;
}


// ==========================================================
// ACTUALIZAR STOCK
// ==========================================================

function actualizarStock(datos) {
  const hoja = obtenerHoja(HOJA_PRODUCTOS);
  const ultimaFila = hoja.getLastRow();

  const valores = hoja.getRange(1, 1, ultimaFila, 15).getValues();

  const idBuscado = String(datos.id || "").trim();
  const skuBuscado = String(datos.sku || "").trim();

  let filaEncontrada = -1;

  for (let i = 1; i < valores.length; i++) {
    const id = String(valores[i][0] || "").trim();
    const sku = String(valores[i][1] || "").trim();

    if (
      (idBuscado && id === idBuscado) ||
      (skuBuscado && sku === skuBuscado)
    ) {
      filaEncontrada = i + 1;
      break;
    }
  }

  if (filaEncontrada === -1) {
    return { ok: false, error: "Producto no encontrado." };
  }

  const stockInicial = numero(valores[filaEncontrada - 1][9]);
  const entradas = numero(valores[filaEncontrada - 1][10]);
  const salidas = numero(valores[filaEncontrada - 1][11]);
  const stockActual = stockInicial + entradas - salidas;

  hoja.getRange(filaEncontrada, 13).setValue(stockActual);

  return {
    ok: true,
    id: valores[filaEncontrada - 1][0],
    sku: valores[filaEncontrada - 1][1],
    stockActual
  };
}


// ==========================================================
// REGISTRAR MOVIMIENTO
// ==========================================================

function registrarMovimiento(datos) {
  const hoja = obtenerHoja(HOJA_MOVIMIENTOS);

  hoja.appendRow([
    datos.tipo || "",
    datos.sku || "",
    datos.id || "",
    datos.producto || "",
    datos.talla || "",
    datos.color || "",
    numero(datos.cantidad),
    new Date(),
    datos.motivo || "",
    datos.pedido || "",
    datos.usuario || ""
  ]);

  return {
    ok: true,
    mensaje: "Movimiento registrado."
  };
}


// ==========================================================
// ASEGURAR ESTRUCTURA DE VENTAS
// ==========================================================
// Estructura definitiva:
// A Pedido
// B Fecha
// C Cliente
// D Teléfono
// E Dirección
// F SKU
// G Producto
// H Talla
// I Color
// J Cantidad
// K Precio
// L Subtotal
// M Descuento
// N Total del pedido
// O Estado
// P Notas
//
// IMPORTANTE:
// Si VENTAS todavía tiene la estructura antigua de 15 columnas,
// se agrega una columna P al final y se inserta "Descuento" en M.
// Los datos existentes se conservan y se desplazan M:O -> N:P.
// ==========================================================

function asegurarEstructuraVentas() {
  const hoja = obtenerHoja(HOJA_VENTAS);

  const encabezadosDeseados = [
    "Pedido",
    "Fecha",
    "Cliente",
    "Telefono",
    "Direccion",
    "SKU",
    "Producto",
    "Talla",
    "Color",
    "Cantidad",
    "Precio",
    "Subtotal",
    "Descuento",
    "Total del pedido",
    "Estado",
    "Notas"
  ];

  // Si ya existe la estructura correcta, no tocarla.
  const ultimaColumna = Math.max(hoja.getLastColumn(), 16);
  const filaEncabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0];

  const estructuraCorrecta = encabezadosDeseados.every(
    (encabezado, indice) =>
      normalizarClave(filaEncabezados[indice] || "") ===
      normalizarClave(encabezado)
  );

  if (estructuraCorrecta) return;

  // Si hay exactamente la estructura antigua de 15 columnas,
  // insertar una columna nueva en M y mover los campos existentes
  // de M:O hacia N:P.
  const esEstructuraAntigua =
    normalizarClave(filaEncabezados[0] || "") === "pedido" &&
    normalizarClave(filaEncabezados[11] || "") === "subtotal" &&
    normalizarClave(filaEncabezados[12] || "") === "total_del_pedido" &&
    normalizarClave(filaEncabezados[13] || "") === "estado" &&
    normalizarClave(filaEncabezados[14] || "") === "notas";

  if (esEstructuraAntigua) {
    hoja.insertColumnBefore(13); // M
    hoja.getRange(1, 13).setValue("Descuento");
    hoja.getRange(1, 14).setValue("Total del pedido");
    hoja.getRange(1, 15).setValue("Estado");
    hoja.getRange(1, 16).setValue("Notas");

    // Las filas antiguas quedan automáticamente desplazadas M:O -> N:P.
    return;
  }

  // Si la hoja está vacía, crear encabezados.
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, 16).setValues([encabezadosDeseados]);
    return;
  }

  // Si existe contenido pero no coincide con la estructura esperada,
  // no borrar información automáticamente. Solo corregir encabezados
  // cuando las columnas principales son reconocibles.
  hoja.getRange(1, 1, 1, 16).setValues([encabezadosDeseados]);
}


// ==========================================================
// VALIDACIÓN Y PROTECCIÓN DE PEDIDOS PÚBLICOS
// ==========================================================

function validarSKUPublico(sku) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(
    String(sku || "").trim()
  );
}

function validarSolicitudVenta(datos, productosPedido) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw new Error("La estructura del pedido no es válida.");
  }

  if (!Array.isArray(productosPedido) || !productosPedido.length) {
    throw new Error("El pedido no contiene productos.");
  }

  if (productosPedido.length > MAX_LINEAS_POR_PEDIDO) {
    throw new Error("El pedido excede el máximo de productos permitido.");
  }

  if (
    typeof datos.cliente !== "string" ||
    typeof datos.telefono !== "string" ||
    typeof datos.direccion !== "string"
  ) {
    throw new Error("Los datos del cliente no tienen un formato válido.");
  }

  const cliente = datos.cliente.trim();
  const telefono = datos.telefono.trim();
  const direccion = datos.direccion.trim();

  if (!cliente || cliente.length > MAX_LONGITUD_CLIENTE) {
    throw new Error("Nombre de cliente inválido.");
  }

  if (!telefono || telefono.length > MAX_LONGITUD_TELEFONO) {
    throw new Error("Teléfono inválido.");
  }

  if (!direccion || direccion.length > MAX_LONGITUD_DIRECCION) {
    throw new Error("Dirección inválida.");
  }
}

function validarRafagaPedidosPublicos() {
  // Apps Script no expone una IP confiable del visitante. Este límite global
  // protege la cuota del proyecto; un proxy/WAF es necesario si se requiere
  // rate limiting real por IP.
  const cache = CacheService.getScriptCache();
  const clave = "lshop_pedidos_publicos_minuto";
  const ahora = Date.now();
  const guardado = cache.get(clave);
  let ventana = guardado ? JSON.parse(guardado) : null;

  if (!ventana || ahora - numero(ventana.inicio) >= 60000) {
    ventana = { inicio: ahora, cantidad: 0 };
  }

  if (numero(ventana.cantidad) >= MAX_PEDIDOS_PUBLICOS_POR_MINUTO) {
    throw new Error("Demasiadas solicitudes. Intenta nuevamente en un minuto.");
  }

  ventana.cantidad = numero(ventana.cantidad) + 1;
  cache.put(clave, JSON.stringify(ventana), 60);
}


// ==========================================================
// REGISTRAR VENTA
// ==========================================================

function registrarVenta(datos) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const productosPedido =
      Array.isArray(datos && datos.productos)
        ? datos.productos
        : [];

    if (!productosPedido.length) {
      throw new Error("El pedido no contiene productos.");
    }

    validarSolicitudVenta(datos, productosPedido);

    const hojaProductos = obtenerHoja(HOJA_PRODUCTOS);
    const hojaVentas = obtenerHoja(HOJA_VENTAS);
    const hojaMovimientos = obtenerHoja(HOJA_MOVIMIENTOS);

    // Asegurar que VENTAS tenga Descuento en M.
    asegurarEstructuraVentas();

    const ultimaFilaProductos = hojaProductos.getLastRow();

    if (ultimaFilaProductos < 2) {
      throw new Error("No hay productos registrados en PRODUCTOS.");
    }

    const valores = hojaProductos
      .getRange(1, 1, ultimaFilaProductos, 15)
      .getValues();

    const porSku = new Map();

    for (let i = 1; i < valores.length; i++) {
      const fila = i + 1;
      const id = String(valores[i][0] || "").trim();
      const sku = String(valores[i][1] || "").trim();
      const activo = String(valores[i][14] || "SI")
        .trim()
        .toLowerCase();

      if (sku) {
        if (porSku.has(sku)) {
          throw new Error("SKU duplicado en PRODUCTOS: " + sku);
        }

        porSku.set(sku, {
          fila,
          indice: i,
          id,
          sku,
          activo
        });
      }
    }

    const pedidoAgrupado = new Map();

    productosPedido.forEach(producto => {
      if (!producto || typeof producto !== "object" || Array.isArray(producto)) {
        throw new Error("La estructura de un producto no es válida.");
      }

      const sku = String(producto && producto.sku || "").trim();
      const cantidad = numero(producto && producto.cantidad);

      if (!sku) {
        throw new Error("Cada producto del pedido debe incluir un SKU de variante.");
      }

      if (!validarSKUPublico(sku)) {
        throw new Error("SKU inválido: " + sku);
      }

      if (
        !Number.isFinite(cantidad) ||
        cantidad <= 0 ||
        Math.floor(cantidad) !== cantidad
      ) {
        throw new Error("Cantidad inválida para SKU " + sku + ".");
      }

      if (!pedidoAgrupado.has(sku)) {
        pedidoAgrupado.set(sku, {
          ...producto,
          sku,
          cantidad: 0
        });
      }

      pedidoAgrupado.get(sku).cantidad += cantidad;
    });

    pedidoAgrupado.forEach(producto => {
      if (producto.cantidad > MAX_CANTIDAD_POR_SKU) {
        throw new Error(
          "La cantidad solicitada excede el máximo permitido para SKU " +
          producto.sku + "."
        );
      }
    });

    const pedido =
      String(datos && datos.pedido || "").trim() ||
      generarNumeroPedido();

    if (pedido.length > 80) {
      throw new Error("Número de pedido inválido.");
    }

    // Idempotencia: mismo pedido = no volver a descontar stock.
    const ultimaFilaVentas = hojaVentas.getLastRow();

    if (ultimaFilaVentas >= 2) {
      const pedidosExistentes = hojaVentas
        .getRange(2, 1, ultimaFilaVentas - 1, 1)
        .getDisplayValues();

      const pedidoYaRegistrado = pedidosExistentes.some(
        fila => String(fila[0] || "").trim() === pedido
      );

      if (pedidoYaRegistrado) {
        const ventasExistentes = hojaVentas
          .getRange(2, 1, ultimaFilaVentas - 1, 16)
          .getValues();

        let totalExistente = 0;
        let descuentoExistente = 0;
        let estadoExistente = "";

        ventasExistentes.forEach(fila => {
          if (String(fila[0] || "").trim() !== pedido) return;

          // M = 12, N = 13 en índice cero.
          const descuentoFila = numero(fila[12]);
          const totalFila = numero(fila[13]);

          if (descuentoFila > 0) descuentoExistente = descuentoFila;
          if (totalFila > 0) totalExistente = totalFila;

          const estadoFila = String(fila[14] || "").trim();
          if (estadoFila) estadoExistente = estadoFila;
        });

        const estadoNormalizado = estadoExistente.toLowerCase();

        if (
          estadoNormalizado !== "pendiente" &&
          estadoNormalizado !== "confirmado"
        ) {
          throw new Error(
            "El pedido " + pedido +
            " ya existe con estado " +
            (estadoExistente || "desconocido") +
            ". Debe iniciarse un pedido nuevo."
          );
        }

        return {
          ok: true,
          pedido,
          total: totalExistente,
          descuento: descuentoExistente,
          estado: estadoExistente,
          mensaje: "El pedido ya estaba registrado. No se volvió a descontar inventario.",
          actualizado: true,
          repetido: true
        };
      }
    }

    validarRafagaPedidosPublicos();

    const lineas = [];

    pedidoAgrupado.forEach(producto => {
      const registro = porSku.get(producto.sku) || null;

      if (!registro) {
        throw new Error("No se encontró la variante con SKU: " + producto.sku);
      }

      if (
        registro.activo === "no" ||
        registro.activo === "false" ||
        registro.activo === "0"
      ) {
        throw new Error("El producto está inactivo: " + producto.sku);
      }

      const fila = valores[registro.indice];

      const stockInicial = numero(fila[9]);
      const entradas = numero(fila[10]);
      const salidas = numero(fila[11]);

      const stockReal = Math.max(
        0,
        stockInicial + entradas - salidas
      );

      if (producto.cantidad > stockReal) {
        throw new Error(
          "Stock insuficiente para " +
          (fila[2] || producto.sku) +
          " (" + producto.sku + "). Disponible: " +
          stockReal +
          ". Solicitado: " +
          producto.cantidad + "."
        );
      }

      const precioReal = numero(fila[6]);

      if (!Number.isFinite(precioReal) || precioReal < 0) {
        throw new Error(
          "El precio de la variante " +
          producto.sku +
          " no es válido en PRODUCTOS."
        );
      }

      lineas.push({
        producto,
        registro,
        fila,
        stockReal,
        precioReal,
        nombreReal: String(fila[2] || "").trim(),
        tallaReal: String(fila[7] || "").trim(),
        colorReal: String(fila[8] || "").trim()
      });
    });

    const fecha = new Date();

    const configuracion = obtenerConfiguracion();

    const porcentajeDescuento =
      obtenerPorcentajeDescuentoSeguro(configuracion);

    let totalFactura = 0;

    lineas.forEach(linea => {
      const cantidad = numero(linea.producto.cantidad);
      totalFactura += cantidad * linea.precioReal;
    });

    const descuento = totalFactura * porcentajeDescuento;

    const totalFinal = Math.max(
      0,
      totalFactura - descuento
    );

    // ------------------------------------------------------
    // PREPARAR FILAS EN EL ORDEN DEFINITIVO:
    // L Subtotal
    // M Descuento
    // N Total del pedido
    // O Estado
    // P Notas
    // ------------------------------------------------------

    const filasVenta = [];

    lineas.forEach((linea, indiceLinea) => {
      const cantidad = numero(linea.producto.cantidad);
      const subtotal = cantidad * linea.precioReal;

      const descuentoPedido =
        indiceLinea === 0 ? descuento : "";

      const totalPedido =
        indiceLinea === 0 ? totalFinal : "";

      filasVenta.push([
        pedido,                                      // A Pedido
        fecha,                                       // B Fecha
        String(datos && datos.cliente || "").trim().substring(0, 200),    // C Cliente
        String(datos && datos.telefono || "").trim().substring(0, 80),   // D Teléfono
        String(datos && datos.direccion || "").trim().substring(0, 300), // E Dirección
        linea.registro.sku,                         // F SKU
        linea.nombreReal,                            // G Producto
        linea.tallaReal,                             // H Talla
        linea.colorReal,                             // I Color
        cantidad,                                    // J Cantidad
        linea.precioReal,                            // K Precio
        subtotal,                                    // L Subtotal
        descuentoPedido,                             // M Descuento
        totalPedido,                                 // N Total
        "Pendiente",                                  // O Estado: nunca viene del cliente
        String(datos && datos.notas || "").trim().substring(0, 500)           // P Notas
      ]);
    });

    hojaVentas.insertRowsBefore(2, filasVenta.length);

    hojaVentas
      .getRange(2, 1, filasVenta.length, 16)
      .setValues(filasVenta);

    // Actualizar stock.
    lineas.forEach(linea => {
      const cantidad = numero(linea.producto.cantidad);
      const salidasActuales = numero(linea.fila[11]);
      const stockNuevo = Math.max(
        0,
        linea.stockReal - cantidad
      );

      hojaProductos
        .getRange(linea.registro.fila, 12)
        .setValue(salidasActuales + cantidad);

      hojaProductos
        .getRange(linea.registro.fila, 13)
        .setValue(stockNuevo);
    });

    // Registrar movimientos.
    lineas.forEach(linea => {
      const cantidad = numero(linea.producto.cantidad);

      hojaMovimientos.appendRow([
        "SALIDA",
        linea.registro.sku,
        linea.registro.id,
        linea.nombreReal,
        linea.tallaReal,
        linea.colorReal,
        cantidad,
        fecha,
        "Venta",
        pedido,
        "Página web"
      ]);
    });

    return {
      ok: true,
      pedido,
      subtotal: totalFactura,
      descuento,
      porcentajeDescuento,
      total: totalFinal,
      mensaje: "Venta registrada correctamente.",
      actualizado: true
    };

  } finally {
    lock.releaseLock();
  }
}


// ==========================================================
// DESCUENTO SEGURO DESDE CONFIGURACION
// ==========================================================

function obtenerPorcentajeDescuentoSeguro(configuracion) {
  const valor =
    configuracion &&
    (
      configuracion.descuento_general ||
      configuracion.descuento ||
      "0%"
    );

  let texto = String(valor || "0")
    .trim()
    .replace(",", ".");

  if (texto.endsWith("%")) {
    texto = texto.slice(0, -1);
  }

  const porcentaje = parseFloat(texto);

  if (!Number.isFinite(porcentaje) || porcentaje <= 0) {
    return 0;
  }

  return Math.min(porcentaje / 100, 1);
}


// ==========================================================
// ACTUALIZAR STOCK DESPUÉS DE VENTA
// ==========================================================

function actualizarStockVenta(producto, cantidad, pedido) {
  const hoja = obtenerHoja(HOJA_PRODUCTOS);
  const ultimaFila = hoja.getLastRow();

  const valores = hoja
    .getRange(1, 1, ultimaFila, 15)
    .getValues();

  const idBuscado = String(producto.id || "").trim();
  const skuBuscado = String(producto.sku || "").trim();

  for (let i = 1; i < valores.length; i++) {
    const id = String(valores[i][0] || "").trim();
    const sku = String(valores[i][1] || "").trim();

    if (
      (idBuscado && id === idBuscado) ||
      (skuBuscado && sku === skuBuscado)
    ) {
      const fila = i + 1;

      const salidasActuales = numero(valores[i][11]);
      const stockActual = numero(valores[i][12]);

      hoja.getRange(fila, 12).setValue(
        salidasActuales + cantidad
      );

      hoja.getRange(fila, 13).setValue(
        Math.max(0, stockActual - cantidad)
      );

      registrarMovimiento({
        tipo: "SALIDA",
        sku,
        id,
        producto: valores[i][2],
        talla: producto.talla || "",
        color: producto.color || "",
        cantidad,
        motivo: "Venta",
        pedido,
        usuario: "Página web"
      });

      return;
    }
  }

  throw new Error(
    "No se encontró el producto para actualizar stock."
  );
}


// ==========================================================
// GENERAR PEDIDO
// ==========================================================

function generarNumeroPedido() {
  const ahora = new Date();

  const fecha = Utilities.formatDate(
    ahora,
    Session.getScriptTimeZone(),
    "yyyyMMdd"
  );

  const hora = Utilities.formatDate(
    ahora,
    Session.getScriptTimeZone(),
    "HHmmss"
  );

  const milisegundos = String(
    ahora.getMilliseconds()
  ).padStart(3, "0");

  const aleatorio = Math.floor(
    100 + Math.random() * 900
  );

  return "LS-" + fecha + "-" + hora + milisegundos + "-" + aleatorio;
}


// ==========================================================
// PRUEBA DE CONEXIÓN
// ==========================================================

function probarConexion() {
  const productos = obtenerProductos();

  Logger.log(
    JSON.stringify(productos, null, 2)
  );
}


// ==========================================================
// LSHOP — IMPORTAR INVENTARIO ORIGINAL DESDE APP.JS
// ==========================================================

function importarInventarioOriginal() {
  const hoja = obtenerHoja(HOJA_PRODUCTOS);

  const productosOriginales = [
    {
      id: 1,
      nombre: "Alo Yoga Legging",
      categoria: "Ropa deportiva",
      genero: "Mujer",
      tamano: "",
      precio: 1100,
      tallas: ["M"],
      colores: [
        { nombre: "Verde Oscuro", imagen: "imagenes/high_waist_airlift_legging_charcoal green_1.jpg", stock: 2 },
        { nombre: "Beige Grisaceo", imagen: "imagenes/high_waist_airlift_legging_mushroom_1.jpg", stock: 1 },
        { nombre: "Azul Marino", imagen: "imagenes/high_waist_airlift_legging_azul marino_1.jpg", stock: 1 },
        { nombre: "Cafe Oscuro", imagen: "imagenes/high_waist_airlift_legging_espresso_1.jpg", stock: 2 }
      ]
    },
    {
      id: 2,
      nombre: "Alo Yoga Water Bottle 24oz",
      categoria: "Vasos y Termos",
      genero: "",
      tamano: "",
      precio: 1350,
      tallas: [],
      colores: [
        { nombre: "Negro", imagen: "imagenes/vaso1_negro.jpg", stock: 6 },
        { nombre: "Blanco", imagen: "imagenes/vaso1_blanco.jpg", stock: 3 }
      ]
    },
    {
      id: 3,
      nombre: "Alo Yoga Calcetines Unisex Cortos",
      categoria: "Ropa deportiva",
      genero: "",
      tamano: "",
      precio: 450,
      tallas: ["M"],
      colores: [
        { nombre: "Gris", imagen: "imagenes/calcetas_half-crw_alo_unisex_gris_1.jpg", stock: 1 },
        { nombre: "Blanco", imagen: "imagenes/calcetas_half-crw_alo_unisex_blanco_1.jpg", stock: 1 },
        { nombre: "Negro", imagen: "imagenes/calcetas_half-crw_alo_unisex_negro_1.jpg", stock: 3 },
        { nombre: "Azul Marino", imagen: "imagenes/calcetas_half-crw_alo_unisex_azul_marino_1.jpg", stock: 4 }
      ]
    },
    {
      id: 4,
      nombre: "Alo Yoga Calcetines Unisex Retro",
      categoria: "Ropa deportiva",
      genero: "",
      tamano: "",
      precio: 450,
      tallas: ["M"],
      colores: [
        { nombre: "Blanco", imagen: "imagenes/calcetas_throwback_alo_unisex_blanco_1.jpg", stock: 2 },
        { nombre: "Gris", imagen: "imagenes/calcetas_throwback_alo_unisex_gris_1.jpg", stock: 1 },
        { nombre: "Beige Claro", imagen: "imagenes/calcetas_throwback_alo_unisex_limestone_1.jpg", stock: 3 },
        { nombre: "Verde Oscuro Carbon", imagen: "imagenes/calcetas_throwback_alo_unisex_verde carbon_1.jpg", stock: 2 }
      ]
    },
    {
      id: 5,
      nombre: "Alo Yoga Calcetines Unisex Fruncidas",
      categoria: "Ropa deportiva",
      genero: "",
      tamano: "",
      precio: 450,
      tallas: ["M"],
      colores: [
        { nombre: "Azul Cielo", imagen: "imagenes/calcetas_scrunch_alo_unisex_azul cielo_1.jpg", stock: 2 }
      ]
    },
    {
      id: 6,
      nombre: "Crocs Classic Clog Niño - Unisex",
      categoria: "Zapatos",
      genero: "",
      tamano: "",
      precio: 850,
      tallas: [
        { talla: "J3", stock: 3 },
        { talla: "C13", stock: 1 }
      ],
      colores: [
        { nombre: "Azul", imagen: "imagenes/crocs_classic_clog_k_1.jpg" }
      ]
    },
    {
      id: 7,
      nombre: "Crocs Getaway de Plataforma",
      categoria: "Zapatos",
      genero: "",
      tamano: "",
      precio: 880,
      tallas: ["W10"],
      colores: [
        { nombre: "Beige", imagen: "imagenes/crocs_getaway_platform_flip_beig_1.jpg", stock: 1 },
        { nombre: "Negro", imagen: "imagenes/crocs_getaway_platform_flip_negro_1.jpg", stock: 1 }
      ]
    },
    {
      id: 8,
      nombre: "VALENTINO BORN IN ROMA DONNA YELLOW EDP (W) / 100 ML",
      categoria: "Lociones",
      genero: "Mujer",
      tamano: "100 ml",
      precio: 2300,
      tallas: [],
      colores: [],
      imagen: "imagenes/Valentino_Born_in_Roma_Donna_Yellow_1.jpg",
      stock: 1
    },
    {
      id: 10,
      nombre: "GUCCI Bloom Acqua Di Fiori Eau De Toilette for Women / 3.3 OZ",
      categoria: "Lociones",
      genero: "Mujer",
      tamano: "100 ml",
      precio: 2200,
      tallas: [],
      colores: [],
      imagen: "imagenes/Gucci_Bloom_Acqua_Di_Fiori_1.jpg",
      stock: 2
    },
    {
      id: 11,
      nombre: "GUCCI BLOOM EDP FOR WOMEN / 3.3 OZ",
      categoria: "Lociones",
      genero: "Mujer",
      tamano: "100 ml",
      precio: 2300,
      tallas: [],
      colores: [],
      imagen: "imagenes/Gucci_Bloom_1.jpg",
      stock: 2
    },
    {
      id: 12,
      nombre: "BLACK OPIUM EAU DE PARFUM FOR WOMEN / 3 OZ",
      categoria: "Lociones",
      genero: "Mujer",
      tamano: "90 ml",
      precio: 2350,
      tallas: [],
      colores: [],
      imagen: "imagenes/Black_Opium_YVSL_1.jpg",
      stock: 2
    },
    {
      id: 13,
      nombre: "ARIANA GRANDE CLOUD EDP FOR WOMEN / 3.4 OZ",
      categoria: "Lociones",
      genero: "Mujer",
      tamano: "100 ml",
      precio: 1350,
      tallas: [],
      colores: [],
      imagen: "imagenes/Ariana_Cloud_1.jpg",
      stock: 1
    },
    {
      id: 14,
      nombre: "Chanel Coco Mademoiselle Eau de Parfum For Women / 3.4 OZ",
      categoria: "Lociones",
      genero: "Mujer",
      tamano: "100 ml",
      precio: 2750,
      tallas: [],
      colores: [],
      imagen: "imagenes/Chanel_Coco_Mademoiselle_1.jpg",
      stock: 2
    },
    {
      id: 15,
      nombre: "Chanel No 5 Eau de Parfum Red Edition For Women / 3.4 OZ",
      categoria: "Lociones",
      genero: "Mujer",
      tamano: "100 ml",
      precio: 2200,
      tallas: [],
      colores: [],
      imagen: "imagenes/Chanel_No5_Paris_1.jpg",
      stock: 1
    },
    {
      id: 16,
      nombre: "Chanel Chance Eau Tendre de Parfum For Women / 3.4 OZ",
      categoria: "Lociones",
      genero: "Mujer",
      tamano: "100 ml",
      precio: 2450,
      tallas: [],
      colores: [],
      imagen: "imagenes/Chanel_Chance_1.jpg",
      stock: 1
    }
  ];

  const filas = [];

  productosOriginales.forEach(producto => {
    if (
      Array.isArray(producto.tallas) &&
      producto.tallas.length > 0 &&
      typeof producto.tallas[0] === "object"
    ) {
      producto.tallas.forEach(tallaObj => {
        const color =
          producto.colores && producto.colores.length > 0
            ? producto.colores[0]
            : null;

        const stock = numero(tallaObj.stock);
        const sku = generarSKUImportacion(
          producto.id,
          tallaObj.talla,
          color ? color.nombre : ""
        );

        filas.push([
          producto.id,
          sku,
          producto.nombre,
          producto.categoria,
          producto.genero || "",
          producto.tamano || "",
          producto.precio,
          tallaObj.talla || "",
          color ? color.nombre : "",
          stock,
          0,
          0,
          stock,
          color ? color.imagen : (producto.imagen || ""),
          "SI"
        ]);
      });
      return;
    }

    if (
      Array.isArray(producto.colores) &&
      producto.colores.length > 0
    ) {
      producto.colores.forEach(color => {
        const talla =
          Array.isArray(producto.tallas) && producto.tallas.length > 0
            ? (
                typeof producto.tallas[0] === "object"
                  ? producto.tallas[0].talla
                  : producto.tallas[0]
              )
            : "";

        const stock = numero(color.stock);

        const sku = generarSKUImportacion(
          producto.id,
          talla,
          color.nombre
        );

        filas.push([
          producto.id,
          sku,
          producto.nombre,
          producto.categoria,
          producto.genero || "",
          producto.tamano || "",
          producto.precio,
          talla,
          color.nombre || "",
          stock,
          0,
          0,
          stock,
          color.imagen || "",
          "SI"
        ]);
      });
      return;
    }

    const stock = numero(producto.stock);
    const sku = generarSKUImportacion(producto.id, "", "");

    filas.push([
      producto.id,
      sku,
      producto.nombre,
      producto.categoria,
      producto.genero || "",
      producto.tamano || "",
      producto.precio,
      "",
      "",
      stock,
      0,
      0,
      stock,
      producto.imagen || "",
      "SI"
    ]);
  });

  const encabezados = [
    "ID",
    "SKU",
    "Nombre",
    "Categoría",
    "Género",
    "Tamaño",
    "Precio",
    "Talla",
    "Color",
    "Stock Inicial",
    "Entradas",
    "Salidas",
    "Stock Actual",
    "Imagen",
    "Activo"
  ];

  const ultimaFila = hoja.getLastRow();
  const ultimaColumna = Math.max(
    hoja.getLastColumn(),
    encabezados.length
  );

  if (ultimaFila > 0) {
    hoja.getRange(1, 1, ultimaFila, ultimaColumna).clearContent();
  }

  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);

  if (filas.length > 0) {
    hoja.getRange(2, 1, filas.length, encabezados.length).setValues(filas);
  }

  Logger.log("==========================================");
  Logger.log("IMPORTACIÓN COMPLETADA");
  Logger.log("Filas creadas: " + filas.length);
  Logger.log("Productos originales: " + productosOriginales.length);
  Logger.log("==========================================");

  return {
    ok: true,
    productos: productosOriginales.length,
    filas: filas.length,
    mensaje: "Inventario original importado correctamente."
  };
}


// ==========================================================
// GENERAR SKU
// ==========================================================

function generarSKUImportacion(id, talla, color) {
  const colorLimpio = String(color || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .substring(0, 8);

  const tallaLimpia = String(talla || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();

  let sku = "LS-" + String(id);

  if (tallaLimpia) sku += "-" + tallaLimpia;
  if (colorLimpio) sku += "-" + colorLimpio;

  return sku;
}


// ==========================================================
// RESERVAS DE INVENTARIO
// ==========================================================

function liberarReservasVencidas() {
  return devolverReservasPendientes({
    soloVencidas: true,
    estadoDestino: "Vencido",
    motivo: "Reserva vencida"
  });
}

function cancelarPedido(pedido) {
  if (!pedido) {
    throw new Error("Debes indicar el número de pedido.");
  }

  return devolverReservasPendientes({
    pedido: String(pedido).trim(),
    soloVencidas: false,
    estadoDestino: "Cancelado",
    motivo: "Pedido cancelado"
  });
}

function confirmarPedido(pedido) {
  if (!pedido) {
    throw new Error("Debes indicar el número de pedido.");
  }

  liberarReservasVencidas();

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const hojaVentas = obtenerHoja(HOJA_VENTAS);
    asegurarEstructuraVentas();

    const ultimaFila = hojaVentas.getLastRow();

    if (ultimaFila < 2) {
      throw new Error("No hay pedidos registrados en VENTAS.");
    }

    const filas = hojaVentas.getRange(2, 1, ultimaFila - 1, 16).getValues();
    let actualizadas = 0;

    filas.forEach((fila, indice) => {
      const mismoPedido = String(fila[0] || "").trim() === String(pedido).trim();

      // O = Estado
      const estado = String(fila[14] || "").trim().toLowerCase();

      if (mismoPedido && estado === "pendiente") {
        hojaVentas.getRange(indice + 2, 15).setValue("Confirmado");
        actualizadas += 1;
      }
    });

    if (!actualizadas) {
      throw new Error("No se encontró un pedido pendiente con ese número.");
    }

    return {
      ok: true,
      pedido,
      estado: "Confirmado",
      lineas: actualizadas
    };
  } finally {
    lock.releaseLock();
  }
}


function devolverReservasPendientes(opciones) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const opcionesSeguras = opciones || {};

    const hojaVentas = obtenerHoja(HOJA_VENTAS);
    const hojaProductos = obtenerHoja(HOJA_PRODUCTOS);
    const hojaMovimientos = obtenerHoja(HOJA_MOVIMIENTOS);

    asegurarEstructuraVentas();

    const ultimaFilaVentas = hojaVentas.getLastRow();

    if (ultimaFilaVentas < 2) {
      return { ok: true, lineas: 0 };
    }

    const ahora = new Date();
    const limite = MINUTOS_RESERVA * 60 * 1000;

    const filasVentas = hojaVentas
      .getRange(2, 1, ultimaFilaVentas - 1, 16)
      .getValues();

    const lineas = [];

    filasVentas.forEach((fila, indice) => {
      const pedido = String(fila[0] || "").trim();
      const fecha = fila[1];

      // O = Estado
      const estado = String(fila[14] || "").trim().toLowerCase();

      const coincidePedido =
        !opcionesSeguras.pedido ||
        pedido === opcionesSeguras.pedido;

      const vencida =
        fecha instanceof Date &&
        !isNaN(fecha) &&
        ahora.getTime() - fecha.getTime() >= limite;

      if (
        estado !== "pendiente" ||
        !coincidePedido ||
        (opcionesSeguras.soloVencidas && !vencida)
      ) {
        return;
      }

      lineas.push({
        filaVenta: indice + 2,
        pedido,
        sku: String(fila[5] || "").trim(),
        producto: String(fila[6] || "").trim(),
        talla: String(fila[7] || "").trim(),
        color: String(fila[8] || "").trim(),
        cantidad: numero(fila[9])
      });
    });

    if (!lineas.length) {
      return { ok: true, lineas: 0 };
    }

    const ultimaFilaProductos = hojaProductos.getLastRow();

    const filasProductos = hojaProductos
      .getRange(1, 1, ultimaFilaProductos, 15)
      .getValues();

    const productosPorSku = new Map();

    for (let i = 1; i < filasProductos.length; i++) {
      const sku = String(filasProductos[i][1] || "").trim();

      if (sku) {
        productosPorSku.set(sku, {
          fila: i + 1,
          valores: filasProductos[i]
        });
      }
    }

    const cantidadesPorSku = new Map();

    lineas.forEach(linea => {
      if (
        !linea.sku ||
        linea.cantidad <= 0 ||
        !productosPorSku.has(linea.sku)
      ) {
        throw new Error(
          "No se pudo devolver la reserva para el SKU: " +
          (linea.sku || "N/D")
        );
      }

      cantidadesPorSku.set(
        linea.sku,
        (cantidadesPorSku.get(linea.sku) || 0) +
        linea.cantidad
      );
    });

    cantidadesPorSku.forEach((cantidad, sku) => {
      const registro = productosPorSku.get(sku);
      const fila = registro.valores;

      const stockInicial = numero(fila[9]);
      const entradas = numero(fila[10]);
      const salidasNuevas = Math.max(
        0,
        numero(fila[11]) - cantidad
      );

      const stockNuevo = Math.max(
        0,
        stockInicial + entradas - salidasNuevas
      );

      hojaProductos
        .getRange(registro.fila, 12)
        .setValue(salidasNuevas);

      hojaProductos
        .getRange(registro.fila, 13)
        .setValue(stockNuevo);
    });

    const estadoDestino =
      opcionesSeguras.estadoDestino || "Vencido";

    const motivo =
      opcionesSeguras.motivo || "Reserva liberada";

    lineas.forEach(linea => {
      // O = Estado
      hojaVentas
        .getRange(linea.filaVenta, 15)
        .setValue(estadoDestino);

      hojaMovimientos.appendRow([
        "DEVOLUCIÓN",
        linea.sku,
        "",
        linea.producto,
        linea.talla,
        linea.color,
        linea.cantidad,
        ahora,
        motivo,
        linea.pedido,
        "Página web"
      ]);
    });

    return {
      ok: true,
      lineas: lineas.length,
      estado: estadoDestino
    };

  } finally {
    lock.releaseLock();
  }
}


// ==========================================================
// ACTIVADOR DE RESERVAS
// ==========================================================

function crearDisparadorReservas() {
  ScriptApp.getProjectTriggers()
    .filter(
      disparador =>
        disparador.getHandlerFunction() ===
        "liberarReservasVencidas"
    )
    .forEach(
      disparador =>
        ScriptApp.deleteTrigger(disparador)
    );

  ScriptApp
    .newTrigger("liberarReservasVencidas")
    .timeBased()
    .everyMinutes(1)
    .create();
}
