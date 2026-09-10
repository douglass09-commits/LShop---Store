    // ==========================================================
    // LSHOP — APP.JS
    // GOOGLE SHEETS → TIENDA WEB
    // ==========================================================
    //
    // Este archivo reemplaza la base de productos manual.
    // Los productos ahora vienen de Google Sheets mediante Apps Script.
    //
    // Hoja PRODUCTOS:
    // ID | SKU | Nombre | Categoría | Género | Tamaño | Precio |
    // Talla | Color | Stock Inicial | Entradas | Salidas |
    // Stock Actual | Imagen | Activo
    // (HEX NO ES UNA COLUMNA DE GOOGLE SHEETS)
    //
    // ==========================================================


    // ==========================================================
    // 1. CONFIGURACIÓN
    // ==========================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwEwD-vX0p3jfF0OqdMFvq8hKKMP6xgvmtGIlbqTguVbK7e0q7JZiWxWYWrUZhT_FimgQ/exec";

    // Debe coincidir con la versión publicada en Code.gs.
    // Si no coincide, la tienda bloquea el envío a WhatsApp.
    const LSHOP_API_VERSION = "FASE1_STOCK_M_V3";


    // Número que tenía anteriormente la tienda.
    // Si CONFIGURACION.whatsapp tiene un número,
    // se utilizará ese.
    const WHATSAPP_FALLBACK =
      "50492164240";


    // ==========================================================
    // 2. VARIABLES GLOBALES
    // ==========================================================

    let productos = [];

    let configuracion = {};

    // ==========================================================
    // RESPALDO LOCAL
    // ==========================================================
    // Si Google Sheets tarda, está temporalmente caído o el navegador
    // tiene una versión anterior de la tienda, la tienda no queda vacía.
    // Estos datos se usan SOLO como respaldo. Cuando Sheets responde,
    // sus datos reemplazan automáticamente este respaldo.
    const PRODUCTOS_FALLBACK = [
      {
        id: 1,
        nombre: "Alo Yoga Legging",
        categoria: "Ropa deportiva",
        precio: "L. 1,100.00",
        tallas: ["M"],
        colores: [
          { 
            nombre: "Verde Oscuro", 
            hex: "#2d4a3e", 
            imagen: "imagenes/high_waist_airlift_legging_charcoal green_1.jpg", 
            imagenes: [
              "imagenes/high_waist_airlift_legging_charcoal green_1.jpg",
              "imagenes/high_waist_airlift_legging_charcoal green_2.jpg",
              "imagenes/high_waist_airlift_legging_charcoal green_3.jpg"
            ],
            stock: 2 
          },
          { 
            nombre: "Beige Grisaceo", 
            hex: "#a39b8b", 
            imagen: "imagenes/high_waist_airlift_legging_mushroom_1.jpg", 
            imagenes: [
              "imagenes/high_waist_airlift_legging_mushroom_1.jpg",
              "imagenes/high_waist_airlift_legging_mushroom_2.jpg"
            ],
            stock: 1 
          },
          { 
            nombre: "Azul Marino", 
            hex: "#1d2a44", 
            imagen: "imagenes/high_waist_airlift_legging_azul marino_1.jpg", 
            imagenes: [
              "imagenes/high_waist_airlift_legging_azul marino_1.jpg",
              "imagenes/high_waist_airlift_legging_azul marino_2.jpg",
              "imagenes/high_waist_airlift_legging_azul marino_3.jpg"
            ],
            stock: 1 
          },
          { 
            nombre: "Cafe Oscuro", 
            hex: "#3b2f2f", 
            imagen: "imagenes/high_waist_airlift_legging_espresso_1.jpg", 
            imagenes: [
              "imagenes/high_waist_airlift_legging_espresso_1.jpg",
              "imagenes/high_waist_airlift_legging_espresso_2.jpg",
              "imagenes/high_waist_airlift_legging_espresso_3.jpg"
            ],
            stock: 2 
          }
        ]
      },
      {
        id: 2,
        nombre: "Alo Yoga Water Bottle 24oz",
        categoria: "Vasos y Termos",
        precio: "L. 1,350.00",
        tallas: [],
        colores: [
          { 
            nombre: "Negro", 
            hex: "#000000", 
            imagen: "imagenes/vaso1_negro.jpg", 
            imagenes: [
              "imagenes/vaso1_negro.jpg",
              "imagenes/vaso1_negro_lado.jpg",
              "imagenes/vaso1_negro_detalle.jpg"
            ], 
            stock: 6 
          },
          { 
            nombre: "Blanco", 
            hex: "#ffffff", 
            imagen: "imagenes/vaso1_blanco.jpg", 
            imagenes: [
              "imagenes/vaso1_blanco.jpg",
              "imagenes/vaso1_blanco_lado.jpg",
              "imagenes/vaso1_blanco_detalle.jpg"
            ],  
            stock: 3 
          }
        ]
      },
      {
        id: 3,
        nombre: "Alo Yoga Calcetines Unisex Cortos",
        categoria: "Ropa deportiva",
        precio: "L. 450.00",
        tallas: ["M"],
        colores: [
          { 
            nombre: "Gris", 
            hex: "#808080", 
            imagen: "imagenes/calcetas_half-crw_alo_unisex_gris_1.jpg", 
            imagenes: [
              "imagenes/calcetas_half-crw_alo_unisex_gris_1.jpg",
              "imagenes/calcetas_half-crw_alo_unisex_gris_2.jpg"
            ],
            stock: 1 
          },
          { 
            nombre: "Blanco", 
            hex: "#ffffff", 
            imagen: "imagenes/calcetas_half-crw_alo_unisex_blanco_1.jpg", 
            imagenes: [
              "imagenes/calcetas_half-crw_alo_unisex_blanco_1.jpg",
              "imagenes/calcetas_half-crw_alo_unisex_blanco_2.jpg"
            ],
            stock: 1 
          },
          { 
            nombre: "Negro", 
            hex: "#000000", 
            imagen: "imagenes/calcetas_half-crw_alo_unisex_negro_1.jpg", 
            imagenes: [
              "imagenes/calcetas_half-crw_alo_unisex_negro_1.jpg",
              "imagenes/calcetas_half-crw_alo_unisex_negro_2.jpg"
            ],
            stock: 3 
          },
          { 
            nombre: "Azul Marino", 
            hex: "#1d2a44", 
            imagen: "imagenes/calcetas_half-crw_alo_unisex_azul_marino_1.jpg", 
            imagenes: [
              "imagenes/calcetas_half-crw_alo_unisex_azul_marino_1.jpg",
              "imagenes/calcetas_half-crw_alo_unisex_azul_marino_2.jpg"
            ],
            stock: 4 
          }
        ]
      },
      {
        id: 4,
        nombre: "Alo Yoga Calcetines Unisex Retro",
        categoria: "Ropa deportiva",
        precio: "L. 450.00",
        tallas: ["M"],
        colores: [
          { 
            nombre: "Blanco", 
            hex: "#ffffff", 
            imagen: "imagenes/calcetas_throwback_alo_unisex_blanco_1.jpg", 
            imagenes: [
              "imagenes/calcetas_throwback_alo_unisex_blanco_1.jpg",
              "imagenes/calcetas_throwback_alo_unisex_blanco_2.jpg"
            ],
            stock: 2 
          },
          { 
            nombre: "Gris", 
            hex: "#808080", 
            imagen: "imagenes/calcetas_throwback_alo_unisex_gris_1.jpg", 
            imagenes: [
              "imagenes/calcetas_throwback_alo_unisex_gris_1.jpg",
              "imagenes/calcetas_throwback_alo_unisex_gris_2.jpg"
            ],
            stock: 1 
          },
          { 
            nombre: "Beige Claro", 
            hex: "#e4d5b7", 
            imagen: "imagenes/calcetas_throwback_alo_unisex_limestone_1.jpg", 
            imagenes: [
              "imagenes/calcetas_throwback_alo_unisex_limestone_1.jpg",
              "imagenes/calcetas_throwback_alo_unisex_limestone_2.jpg"
            ],
            stock: 3 
          },
          { 
            nombre: "Verde Oscuro Carbon", 
            hex: "#1c2826", 
            imagen: "imagenes/calcetas_throwback_alo_unisex_verde carbon_1.jpg", 
            imagenes: [
              "imagenes/calcetas_throwback_alo_unisex_verde carbon_1.jpg",
              "imagenes/calcetas_throwback_alo_unisex_verde carbon_2.jpg"
            ],
            stock: 2 
          }
        ]
      },
      {
        id: 5,
        nombre: "Alo Yoga Calcetines Unisex Fruncidas",
        categoria: "Ropa deportiva",
        precio: "L. 450.00",
        tallas: ["M"],
        colores: [
          { 
            nombre: "Azul Cielo", 
            hex: "#87ceeb", 
            imagen: "imagenes/calcetas_scrunch_alo_unisex_azul cielo_1.jpg", 
            imagenes: [
              "imagenes/calcetas_scrunch_alo_unisex_azul cielo_1.jpg",
              "imagenes/calcetas_scrunch_alo_unisex_azul cielo_2.jpg"
            ],
            stock: 2 
          }
        ]
      },
      {
        id: 6,
        nombre: "Crocs Classic Clog Niño - Unisex",
        categoria: "Zapatos",
        precio: "L. 850.00",
        tallas: [
          { talla: "J3", stock: 3 },
          { talla: "C13", stock: 1 }
        ],
        colores: [
          { 
            nombre: "Azul", 
            hex: "#0055a5", 
            imagen: "imagenes/crocs_classic_clog_k_1.jpg", 
            imagenes: [
              "imagenes/crocs_classic_clog_k_1.jpg",
              "imagenes/crocs_classic_clog_k_2.jpg"
            ]
          }
        ]
      },
      {
        id: 7,
        nombre: "Crocs Getaway de Plataforma",
        categoria: "Zapatos",
        precio: "L. 880.00",
        tallas: ["W10"],
        colores: [
          { 
            nombre: "Beige", 
            hex: "#F5F5DC", 
            imagen: "imagenes/crocs_getaway_platform_flip_beig_1.jpg", 
            imagenes: [
              "imagenes/crocs_getaway_platform_flip_beig_1.jpg",
              "imagenes/crocs_getaway_platform_flip_beig_2.jpg",
              "imagenes/crocs_getaway_platform_flip_beig_3.jpg"
            ],
            stock: 1 
          },
          { 
            nombre: "Negro", 
            hex: "#000000", 
            imagen: "imagenes/crocs_getaway_platform_flip_negro_1.jpg", 
            imagenes: [
              "imagenes/crocs_getaway_platform_flip_negro_1.jpg",
              "imagenes/crocs_getaway_platform_flip_negro_2.jpg",
              "imagenes/crocs_getaway_platform_flip_negro_3.jpg"
            ],
            stock: 1 
          }
        ]
      },
      {
        id: 8,
        nombre: "VALENTINO BORN IN ROMA DONNA YELLOW EDP (W) / 100 ML",
        categoria: "Lociones",
        genero: "Mujer",
        tamano: "100 ml",
        precio: "L. 2,300.00",
        descripcion: "Fragancia femenina, fresca y radiante que combina destellos citricos con la elegancia de las flores",
        imagen: "imagenes/Valentino_Born_in_Roma_Donna_Yellow_1.jpg",
        imagenes: [
          "imagenes/Valentino_Born_in_Roma_Donna_Yellow_1.jpg",
          "imagenes/Valentino_Born_in_Roma_Donna_Yellow_2.jpg",
          "imagenes/Valentino_Born_in_Roma_Donna_Yellow_3.jpg"
        ],
        stock: 1
      },
    {
        id: 10,
        nombre: "GUCCI Bloom Acqua Di Fiori Eau De Toilette for Women / 3.3 OZ",
        categoria: "Lociones",
        genero: "Mujer",
        tamano: "100 ml",
        precio: "L. 2,200.00",
        descripcion: "Fragancia femenina fresca, verde y revitalizante que evoca la belleza de un jardin floral al amanecer",
        imagen: "imagenes/Gucci_Bloom_Acqua_Di_Fiori_1.jpg",
        imagenes: [
          "imagenes/Gucci_Bloom_Acqua_Di_Fiori_1.jpg",
          "imagenes/Gucci_Bloom_Acqua_Di_Fiori_2.jpg",
          "imagenes/Gucci_Bloom_Acqua_Di_Fiori_3.jpg"
        ],
        stock: 2
      },
    {
        id: 11,
        nombre: "GUCCI BLOOM EDP FOR WOMEN / 3.3 OZ",
        categoria: "Lociones",
        genero: "Mujer",
        tamano: "100 ml",
        precio: "L. 2,300.00",
        descripcion: "Fragancia femenina clasica, elegante y envolvente que celebra la autenticidad y la feminidad con un bouquet floral rico y natural",
        imagen: "imagenes/Gucci_Bloom_1.jpg",
        imagenes: [
          "imagenes/Gucci_Bloom_1.jpg",
          "imagenes/Gucci_Bloom_2.jpg",
          "imagenes/Gucci_Bloom_3.jpg"
        ],
        stock: 2
      },
    {
        id: 12,
        nombre: "BLACK OPIUM EAU DE PARFUM FOR WOMEN / 3 OZ",
        categoria: "Lociones",
        genero: "Mujer",
        tamano: "90 ml",
        precio: "L. 2,350.00",
        descripcion: "BLACK OPIUM, una fragancia como una inyección de adrenalina, la energía necesaria para una vida cada vez más intensa.",
        imagen: "imagenes/Black_Opium_YVSL_1.jpg",
        imagenes: [
          "imagenes/Black_Opium_YVSL_1.jpg",
          "imagenes/Black_Opium_YVSL_2.jpg",
          "imagenes/Black_Opium_YVSL_3.jpg"
        ],
        stock: 2
      },
    {
        id: 13,
        nombre: "ARIANA GRANDE CLOUD EDP FOR WOMEN / 3.4 OZ",
        categoria: "Lociones",
        genero: "Mujer",
        tamano: "100 ml",
        precio: "L. 1,350.00",
        descripcion: "La nube de fragancias de Ariana Grande es la nueva fragancia con aroma adictivo que se abre con una mezcla de ensueño de seductora flor de lavanda, pera jugosa prohibida y bergamota deliciosa. El corazón de la fragancia es un toque batido de crema de coco, praliné indulgente y exótica orquídea de vainilla",
        imagen: "imagenes/Ariana_Cloud_1.jpg",
        imagenes: [
          "imagenes/Ariana_Cloud_1.jpg",
          "imagenes/Ariana_Cloud_2.jpg",
          "imagenes/Ariana_Cloud_3.jpg"
        ],
        stock: 1
      },
    {
        id: 14,
        nombre: "Chanel Coco Mademoiselle Eau de Parfum For Women / 3.4 OZ",
        categoria: "Lociones",
        genero: "Mujer",
        tamano: "100 ml",
        precio: "L. 2,750.00",
        descripcion: "Una version mas profunda, magnetica e intensa del clasico icono, donde destaca una sobredosis de pachuli envuelta en la calidez de la vainilla y el haba tonka",
        imagen: "imagenes/Chanel_Coco_Mademoiselle_1.jpg",
        imagenes: [
          "imagenes/Chanel_Coco_Mademoiselle_1.jpg",
          "imagenes/Chanel_Coco_Mademoiselle_2.jpg",
          "imagenes/Chanel_Coco_Mademoiselle_3.jpg"
        ],
        stock: 2
      },
      {
        id: 15,
        nombre: "Chanel No 5 Eau de Parfum Red Edition For Women / 3.4 OZ",
        categoria: "Lociones",
        genero: "Mujer",
        tamano: "100 ml",
        precio: "L. 2,200.00",
        descripcion: "Una edicion limitada exclusiva del clasico mas iconico de la perfumeria mundial, es una fragancia de la familia olfativa Floral Aldehídica. Con notas aldehídicas, ylang-ylang, neroli, bergamota y durazno (melocotón), las Notas de Corazón son iris, jazmín, rosa y lirio de los valles (muguete).",
        imagen: "imagenes/Chanel_No5_Paris_1.jpg",
        imagenes: [
          "imagenes/Chanel_No5_Paris_1.jpg",
          "imagenes/Chanel_No5_Paris_2.jpg",
          "imagenes/Chanel_No5_Paris_3.jpg"
        ],
        stock: 1
      },
    {
        id: 16,
        nombre: "Chanel Chance Eau Tendre de Parfum For Women / 3.4 OZ",
        categoria: "Lociones",
        genero: "Mujer",
        tamano: "100 ml",
        precio: "L. 2,450.00",
        descripcion: "Una fragancia femenina romantica, delicada y envolvente que intensifica el resplandor floral con un toque frutal irresistible, notas principales: Membrillo, Toronja; Jazmin, Esencia de rosa y Almizcle blanco",
        imagen: "imagenes/Chanel_Chance_1.jpg",
        imagenes: [
          "imagenes/Chanel_Chance_1.jpg",
          "imagenes/Chanel_Chance_2.jpg",
          "imagenes/Chanel_Chance_3.jpg"
        ],
        stock: 1
      },

    ];;

    function prepararProductosFallback(lista) {
      return (Array.isArray(lista) ? lista : []).map(p => {
        const tallas = Array.isArray(p.tallas)
          ? p.tallas.map(t => typeof t === "object" ? { ...t } : { talla: String(t), stock: null })
          : [];

        const colores = Array.isArray(p.colores)
          ? p.colores.map(c => ({
              ...c,
              nombre: String(c.nombre || "").trim(),
              hex: c.hex || obtenerHexColor(c.nombre),
              imagen: c.imagen || p.imagen || "",
              imagenes: Array.isArray(c.imagenes) && c.imagenes.length ? c.imagenes : (c.imagen ? [c.imagen] : []),
              stock: Number.isFinite(Number(c.stock)) ? Number(c.stock) : null
            }))
          : [];

        const variantes = [];
        const crearVariante = (base, talla, color, tamano, stock) => {
          // El respaldo debe conservar una identidad distinta por variante.
          // Antes J3 y C13 recibían el mismo SKU "LS-6" y el carrito las
          // fusionaba cuando Sheets no estaba disponible.
          const atributosVariante = [talla, color?.nombre, tamano]
            .map(valor => String(valor || "").trim())
            .filter(Boolean)
            .join("-");

          return {
            id: `fallback-${p.id}-${variantes.length + 1}`,
            sku: p.sku || `LS-${p.id}${atributosVariante ? `-${atributosVariante}` : ""}`,
            talla: talla || "",
            color: color?.nombre || "",
            tamano: tamano || "",
            hex: color?.hex || obtenerHexColor(color?.nombre || ""),
            imagen: color?.imagen || p.imagen || "",
            imagenes: color?.imagenes || (p.imagenes || [p.imagen].filter(Boolean)),
            precio: numero(p.precio),
            precioTexto: formatearPrecioSinConfig(p.precio),
            stock: Math.max(0, Number(stock) || 0)
          };
        };

        if (colores.length && tallas.length) {
          colores.forEach(c => {
            tallas.forEach(t => {
              const ts = Number(t.stock);
              const cs = Number(c.stock);
              const stock = Number.isFinite(ts) && Number.isFinite(cs)
                ? Math.min(ts, cs)
                : Number.isFinite(cs) ? cs
                : Number.isFinite(ts) ? ts
                : Number(p.stock) || 0;
              variantes.push(crearVariante(p, t.talla, c, p.tamano, stock));
            });
          });
        } else if (colores.length) {
          colores.forEach(c => variantes.push(crearVariante(p, "", c, p.tamano, c.stock ?? p.stock)));
        } else if (tallas.length) {
          tallas.forEach(t => variantes.push(crearVariante(p, t.talla, null, p.tamano, t.stock ?? p.stock)));
        } else {
          variantes.push(crearVariante(p, "", null, p.tamano, p.stock));
        }

        const tamanos = Array.isArray(p.tamanos) && p.tamanos.length
          ? p.tamanos
          : (p.tamano ? [{ tamano: p.tamano, stock: Number(p.stock) || 0 }] : []);

        return {
          ...p,
          id: p.id,
          precio: numero(p.precio),
          precioTexto: formatearPrecioSinConfig(p.precio),
          imagenes: Array.isArray(p.imagenes) ? p.imagenes : (p.imagen ? [p.imagen] : []),
          tallas,
          colores,
          tamanos,
          variantes
        };
      });
    }

    productos = prepararProductosFallback(PRODUCTOS_FALLBACK);

    const CARRITO_STORAGE_KEY = "lshop_carrito";
    // Se conserva hasta que el servidor confirme el resultado. Así un
    // reintento después de una respuesta perdida reutiliza el mismo pedido.
    const PEDIDO_PENDIENTE_STORAGE_KEY = "lshop_pedido_pendiente";
    const CARRITO_KEYS_ANTERIORES = [
      "lshop_carrito_v3",
      "lshop_carrito_v2",
      "lshop_cart"
    ];

    function normalizarItemCarritoGuardado(item) {
      if (!item || typeof item !== "object") return null;

      return {
        ...item,
        id: item.id ?? item.productoId ?? item.productId,
        cantidad: Math.max(1, Number(item.cantidad) || 1),
        color: String(item.color || "").trim(),
        tallaSeleccionada: String(item.tallaSeleccionada || item.talla || "N/A").trim() || "N/A",
        tamanoSeleccionado: String(item.tamanoSeleccionado || item.tamano || "").trim(),
        precio: numero(item.precio || 0)
      };
    }

    function cargarCarritoGuardado() {
      const claves = [CARRITO_STORAGE_KEY, ...CARRITO_KEYS_ANTERIORES];

      for (const clave of claves) {
        try {
          const guardado = localStorage.getItem(clave);
          if (!guardado) continue;

          const datos = JSON.parse(guardado);
          if (!Array.isArray(datos) || !datos.length) continue;

          const normalizados = datos
            .map(normalizarItemCarritoGuardado)
            .filter(Boolean);

          if (normalizados.length) {
            // Migrar automáticamente cualquier carrito anterior
            // al almacenamiento actual sin perder productos.
            try {
              localStorage.setItem(
                CARRITO_STORAGE_KEY,
                JSON.stringify(normalizados)
              );
            } catch (_) {}

            return normalizados;
          }
        } catch (error) {
          console.warn("LSHOP — no se pudo leer", clave, error);
        }
      }

      return [];
    }

    function guardarCarrito() {
      try {
        localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(carrito));
      } catch (error) {
        console.warn("LSHOP — no se pudo guardar el carrito:", error);
      }
    }

    function crearFirmaCheckout(productosVenta) {
      return JSON.stringify(
        (Array.isArray(productosVenta) ? productosVenta : [])
          .map(producto => ({
            sku: String(producto.sku || "").trim(),
            cantidad: Number(producto.cantidad) || 0
          }))
          .sort((a, b) =>
            a.sku.localeCompare(b.sku) || a.cantidad - b.cantidad
          )
      );
    }

    function obtenerPedidoCheckout(firma) {
      const firmaSegura = String(firma || "");

      try {
        const guardado = localStorage.getItem(PEDIDO_PENDIENTE_STORAGE_KEY);
        const pendiente = guardado ? JSON.parse(guardado) : null;

        if (
          pendiente &&
          pendiente.pedido &&
          pendiente.firma === firmaSegura
        ) {
          return { pedido: String(pendiente.pedido), esReintento: true };
        }
      } catch (error) {
        console.warn("LSHOP — no se pudo leer el pedido pendiente:", error);
      }

      const pedido = generarNumeroPedidoLocal();

      try {
        localStorage.setItem(
          PEDIDO_PENDIENTE_STORAGE_KEY,
          JSON.stringify({ pedido, firma: firmaSegura, creadoEn: Date.now() })
        );
      } catch (error) {
        console.warn("LSHOP — no se pudo guardar el pedido pendiente:", error);
      }

      return { pedido, esReintento: false };
    }

    function limpiarPedidoCheckoutPendiente(pedido) {
      try {
        const guardado = localStorage.getItem(PEDIDO_PENDIENTE_STORAGE_KEY);
        const pendiente = guardado ? JSON.parse(guardado) : null;

        if (!pedido || !pendiente || String(pendiente.pedido) === String(pedido)) {
          localStorage.removeItem(PEDIDO_PENDIENTE_STORAGE_KEY);
        }
      } catch (error) {
        console.warn("LSHOP — no se pudo limpiar el pedido pendiente:", error);
      }
    }

    async function verificarPedidoEnGoogleSheets(pedido) {
      try {
        const respuesta = await fetch(
          API_URL +
            "?accion=verificarPedido&pedido=" +
            encodeURIComponent(pedido) +
            "&t=" +
            Date.now(),
          {
            method: "GET",
            cache: "no-store"
          }
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo verificar el pedido pendiente.");
        }

        const resultado = await respuesta.json();

        if (resultado.version !== LSHOP_API_VERSION) {
          throw new Error("La conexión con inventario usa una versión incompatible.");
        }

        return resultado;
      } catch (error) {
        // Si la verificación falla, se reenvía el MISMO pedido. El servidor
        // mantiene la idempotencia y decidirá si ya fue registrado.
        console.warn("LSHOP — no se pudo verificar el pedido pendiente:", error);
        return null;
      }
    }

    let carrito = cargarCarritoGuardado();

    // Sincronización automática con Google Sheets.
    let ultimaFirmaDatos = "";
    let intervaloActualizacion = null;

    let cargandoProductos = false;

    let ventaRegistrada = false;


    // ==========================================================
    // 3. UTILIDADES
    // ==========================================================

    function numero(valor) {

      if (
        typeof valor === "number" &&
        !isNaN(valor)
      ) {
        return valor;
      }

      let texto =
        String(valor ?? "")
          .trim();

      if (!texto) {
        return 0;
      }


      // Quitar moneda
      texto =
        texto
          .replace(/L\./gi, "")
          .replace(/L\s*/gi, "")
          .trim();


      // Si viene con formato 1,100.00
      if (
        texto.includes(",") &&
        texto.includes(".")
      ) {

        texto =
          texto.replace(/,/g, "");

      }

      // Si viene como 1.100,00
      else if (
        texto.includes(".") &&
        texto.includes(",")
      ) {

        texto =
          texto
            .replace(/\./g, "")
            .replace(",", ".");

      }

      else {

        texto =
          texto.replace(/,/g, "");

      }


      texto =
        texto.replace(
          /[^0-9.-]/g,
          ""
        );


      const resultado =
        parseFloat(texto);


      return isNaN(resultado)
        ? 0
        : resultado;

    }


    // ----------------------------------------------------------
    // Escapar HTML
    // ----------------------------------------------------------

    function escaparHTML(valor) {

      return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    }


    // ----------------------------------------------------------
    // Escapar texto para atributo JS
    // ----------------------------------------------------------

    function escaparJS(valor) {

      return String(valor ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "");

    }


    // ----------------------------------------------------------
    // Formato moneda
    // ----------------------------------------------------------

    function formatearMoneda(valor) {

      const cantidad =
        numero(valor);

      const moneda =
        configuracion.moneda ||
        "L.";

      return (
        moneda +
        " " +
        cantidad.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }
        )
      );

    }


    // ----------------------------------------------------------
    // Obtener descuento
    // ----------------------------------------------------------

    function obtenerDescuento() {

      const valor =
        configuracion.descuento_general ||
        configuracion.descuento ||
        "0%";


      let texto =
        String(valor)
          .trim()
          .replace(",", ".");


      if (texto.endsWith("%")) {

        texto =
          texto.slice(
            0,
            -1
          );

      }


      const porcentaje =
        parseFloat(texto);


      if (
        isNaN(porcentaje) ||
        porcentaje <= 0
      ) {

        return 0;

      }


      return Math.min(
        porcentaje / 100,
        1
      );

    }


    // ----------------------------------------------------------
    // Obtener teléfono WhatsApp
    // ----------------------------------------------------------

    function obtenerWhatsApp() {

      let telefono =
        configuracion.whatsapp ||
        configuracion.telefono_whatsapp ||
        configuracion.whatsapp_numero ||
        WHATSAPP_FALLBACK;


      telefono =
        String(telefono)
          .replace(/\D/g, "");


      return telefono ||
        WHATSAPP_FALLBACK;

    }


    // ==========================================================
    // 4. CARGAR DATOS DESDE GOOGLE SHEETS
    // ==========================================================

    async function cargarDatosDesdeGoogleSheets(opciones = {}) {

      const silencioso = Boolean(opciones.silencioso);

      if (cargandoProductos) {
        return;
      }


      cargandoProductos = true;


      const contenedor =
        document.getElementById(
          "product-list"
        );


      if (contenedor && !silencioso) {

        contenedor.innerHTML = `
          <div class="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
            <div class="text-3xl mb-3">⏳</div>
            <p class="text-sm font-semibold">
              Cargando productos...
            </p>
          </div>
        `;

      }


      try {

        const respuesta =
          await fetch(
            API_URL +
            "?accion=todo&t=" +
            Date.now(),
            {
              method: "GET",
              cache: "no-store"
            }
          );


        if (!respuesta.ok) {

          throw new Error(
            "No se pudo conectar con Google Sheets."
          );

        }


        const datos =
          await respuesta.json();


        console.log(
          "LSHOP — respuesta de Apps Script:",
          datos
        );


        if (!datos.ok) {

          throw new Error(
            datos.error ||
            "Apps Script devolvió un error."
          );

        }


        // -----------------------------------------------
        // CONFIGURACIÓN
        // -----------------------------------------------

        const nuevaConfiguracion =
          datos.configuracion ||
          {};

        const productosRecibidos =
          Array.isArray(datos.productos)
            ? datos.productos
            : [];

        const nuevosProductos =
          transformarProductos(
            productosRecibidos
          );

        // Si Sheets responde pero no trae productos, no borrar la tienda.
        if (!nuevosProductos.length) {
          if (!productos.length) {
            productos = prepararProductosFallback(PRODUCTOS_FALLBACK);
          }

          actualizarCarrito();
          return;
        }

        const nuevaFirma = JSON.stringify({
          configuracion: nuevaConfiguracion,
          productos: nuevosProductos
        });

        if (nuevaFirma !== ultimaFirmaDatos) {
          configuracion = nuevaConfiguracion;
          productos = nuevosProductos;
          ultimaFirmaDatos = nuevaFirma;

          console.log(
            "LSHOP — datos actualizados desde Google Sheets.",
            productos
          );

          renderizarProductos(productos);
          actualizarCarrito();
        } else if (!silencioso) {
          actualizarCarrito();
        }


      }

      catch (error) {

        console.error(
          "LSHOP — Error cargando Google Sheets:",
          error
        );


        // No dejar la tienda ni el carrito en blanco si Apps Script
        // falla. Se conserva el respaldo local y se vuelve a intentar
        // en la próxima actualización automática.
        if (!productos.length) {
          productos = prepararProductosFallback(PRODUCTOS_FALLBACK);
        }

        if (contenedor) {
          renderizarProductos(productos);
        }

        actualizarCarrito();

      }

      finally {

        cargandoProductos =
          false;

      }

    }


    function obtenerHexColor(color) {

      const nombre = String(color || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

      const colores = {
        negro: "#000000",
        blanco: "#ffffff",
        gris: "#808080",
        rojo: "#dc2626",
        azul: "#2563eb",
        "azul marino": "#1d2a44",
        verde: "#16a34a",
        "verde oscuro": "#166534",
        "verde oscuro carbon": "#1c2826",
        amarillo: "#eab308",
        naranja: "#f97316",
        rosa: "#ec4899",
        rosado: "#ec4899",
        morado: "#9333ea",
        purpura: "#9333ea",
        cafe: "#78350f",
        "cafe oscuro": "#3b2f2f",
        beige: "#f5f5dc",
        "beige claro": "#e4d5b7",
        "beige grisaceo": "#a39b8b",
        dorado: "#d4af37",
        plateado: "#c0c0c0"
      };

      if (colores[nombre]) return colores[nombre];

      for (const clave in colores) {
        if (nombre.includes(clave)) return colores[clave];
      }

      return "#cccccc";
    }


    // ==========================================================
    // 5. TRANSFORMAR FILAS DEL SHEET
    // ==========================================================
    //
    // Google Sheets entrega una fila por variante.
    //
    // Ejemplo:
    //
    // ID  SKU  Nombre       Talla Color Stock
    // 1   A1   Legging      M     Verde 2
    // 2   A2   Legging      L     Verde 1
    // 3   A3   Legging      M     Negro 3
    //
    // La tienda necesita:
    //
    // producto
    //   tallas[]
    //   colores[]
    //   variantes[]
    //
    // ==========================================================

    function transformarProductos(filas) {

      const mapa = new Map();

      filas.forEach(fila => {

        const activo = String(fila.activo ?? "").trim().toLowerCase();
        if (activo === "no" || activo === "false" || activo === "0") return;

        const nombre = String(fila.nombre || "").trim();
        if (!nombre) return;

        const clave = nombre.toLowerCase();

        if (!mapa.has(clave)) {
          mapa.set(clave, {
            id: fila.id,
            sku: fila.sku || "",
            nombre,
            categoria: fila.categoria || "",
            genero: fila.genero || "",
            tamano: fila.tamano || "",
            precio: numero(fila.precio),
            precioTexto: formatearPrecioSinConfig(fila.precio),
            descripcion: fila.descripcion || "",
            notas: fila.notas || null,
            imagen: fila.imagen || "",
            imagenes: fila.imagen ? [fila.imagen] : [],
            tallas: [],
            colores: [],
            tamanos: [],
            variantes: []
          });
        }

        const producto = mapa.get(clave);
        const precioVariante = numero(fila.precio);

        const variante = {
          id: fila.id,
          sku: fila.sku || "",
          talla: fila.talla || "",
          tamano: fila.tamano || "",
          color: fila.color || "",
          // HEX no viene de Google Sheets. El color visual se calcula localmente.
          hex: obtenerHexColor(fila.color),
          imagen: fila.imagen || "",
          imagenes: fila.imagen ? [fila.imagen] : [],
          precio: precioVariante,
          precioTexto: formatearPrecioSinConfig(precioVariante),
          stock: Math.max(0, numero(fila.stockActual))
        };

        producto.variantes.push(variante);

        // El precio general queda como el de la primera variante,
        // pero cada variante conserva su propio precio.
        if (producto.variantes.length === 1) {
          producto.precio = precioVariante;
          producto.precioTexto = formatearPrecioSinConfig(precioVariante);
        }

        if (!producto.imagen && variante.imagen) {
          producto.imagen = variante.imagen;
        }

        if (variante.imagen && !producto.imagenes.includes(variante.imagen)) {
          producto.imagenes.push(variante.imagen);
        }

        if (variante.talla) {
          const existente = producto.tallas.find(t => t.talla === variante.talla);
          if (!existente) {
            producto.tallas.push({ talla: variante.talla, stock: variante.stock });
          } else {
            existente.stock += variante.stock;
          }
        }

        if (variante.tamano) {
          const existenteTamano = producto.tamanos.find(t => String(t.tamano) === String(variante.tamano));
          if (!existenteTamano) {
            producto.tamanos.push({ tamano: variante.tamano, stock: variante.stock });
          } else {
            existenteTamano.stock += variante.stock;
          }
        }

        if (variante.color) {
          let colorExistente = producto.colores.find(c => c.nombre === variante.color);

          if (!colorExistente) {
            colorExistente = {
              nombre: variante.color,
              hex: variante.hex || obtenerHexColor(variante.color),
              imagen: variante.imagen,
              imagenes: variante.imagenes || [],
              precio: variante.precio,
              precioTexto: variante.precioTexto,
              stock: variante.stock
            };
            producto.colores.push(colorExistente);
          } else {
            colorExistente.stock += variante.stock;
            // Si existe más de una talla del mismo color, no cambiamos
            // el precio: el precio correcto se toma de la variante exacta.
            if (!colorExistente.imagen && variante.imagen) {
              colorExistente.imagen = variante.imagen;
            }
          }
        }
      });

      return Array.from(mapa.values());
    }


    // ==========================================================
    // 6. PRECIO
    // ==========================================================

    function formatearPrecioSinConfig(valor) {

      return (
        "L. " +
        numero(valor).toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }
        )
      );

    }


    // ==========================================================
    // 7. OBTENER VARIANTE SELECCIONADA
    // ==========================================================

    function obtenerVarianteSeleccionada(producto) {

      if (
        !producto ||
        !Array.isArray(producto.variantes)
      ) {
        return null;
      }

      const inputTalla =
        document.getElementById(
          `select-talla-${producto.id}`
        );

      const inputColor =
        document.getElementById(
          `color-seleccionado-${producto.id}`
        );

      const talla =
        inputTalla
          ? String(inputTalla.value || "").trim()
          : "";

      const color =
        inputColor
          ? String(inputColor.value || "").trim()
          : "";


      // --------------------------------------------------------
      // BUSCAR TALLA + COLOR EXACTOS
      // --------------------------------------------------------

      if (talla && color) {

        const exacta =
          producto.variantes.find(v =>
            String(v.talla || "").trim() === talla &&
            String(v.color || "").trim() === color
          );

        if (exacta) {
          return exacta;
        }
      }


      // --------------------------------------------------------
      // BUSCAR POR COLOR
      // --------------------------------------------------------

      if (color) {

        const porColor =
          producto.variantes.find(v =>
            String(v.color || "").trim() === color &&
            Number(v.stock) > 0
          );

        if (porColor) {
          return porColor;
        }
      }


      // --------------------------------------------------------
      // BUSCAR POR TALLA
      // --------------------------------------------------------

      if (talla) {

        const porTalla =
          producto.variantes.find(v =>
            String(v.talla || "").trim() === talla &&
            Number(v.stock) > 0
          );

        if (porTalla) {
          return porTalla;
        }
      }


      // --------------------------------------------------------
      // PRIMERA VARIANTE DISPONIBLE
      // --------------------------------------------------------

      return (
        producto.variantes.find(
          v => Number(v.stock) > 0
        ) ||
        producto.variantes[0] ||
        null
      );
    }


    // ==========================================================
    // IDENTIDAD REAL DE UNA VARIANTE DEL CARRITO
    // ==========================================================
    // El ID de producto puede repetirse entre tallas/colores.
    // El SKU identifica la variante real y tiene prioridad.
    function esMismaVarianteCarrito(item, productoId, variante) {
      if (!item || !variante) return false;
      if (Number(item.id) !== Number(productoId)) return false;

      const skuItem = String(item.sku || "").trim().toLowerCase();
      const skuVariante = String(variante.sku || "").trim().toLowerCase();

      if (skuItem && skuVariante) {
        return skuItem === skuVariante;
      }

      return (
        String(item.tallaSeleccionada || "").trim() === String(variante.talla || "").trim() &&
        String(item.color || "").trim() === String(variante.color || "").trim() &&
        String(item.tamanoSeleccionado || "").trim() === String(variante.tamano || "").trim()
      );
    }


    // ==========================================================
    // 8. AGREGAR AL CARRITO
    // ==========================================================

    function agregarAlCarrito(
      idProducto,
      tallaEspecifica = null
    ) {

      const producto =
        productos.find(
          p =>
            Number(p.id) ===
            Number(idProducto)
        );

      if (!producto) {

        console.error(
          "Producto no encontrado:",
          idProducto
        );

        return;
      }


      // --------------------------------------------------------
      // TALLA
      // --------------------------------------------------------

      const inputTalla =
        document.getElementById(
          `select-talla-${idProducto}`
        );


      if (
        tallaEspecifica !== null &&
        tallaEspecifica !== undefined
      ) {

        if (inputTalla) {
          inputTalla.value =
            tallaEspecifica;
        }
      }


      // --------------------------------------------------------
      // COLOR
      // --------------------------------------------------------

      const inputColor =
        document.getElementById(
          `color-seleccionado-${idProducto}`
        );


      if (
        inputColor &&
        !inputColor.value &&
        Array.isArray(producto.colores) &&
        producto.colores.length
      ) {

        inputColor.value =
          producto.colores[0].nombre;
      }


      // --------------------------------------------------------
      // OBTENER VARIANTE
      // --------------------------------------------------------

      const variante =
        obtenerVarianteSeleccionada(
          producto
        );


      if (!variante) {

        alert(
          "No se encontró una variante disponible."
        );

        return;
      }


      // --------------------------------------------------------
      // STOCK
      // --------------------------------------------------------

      const stock =
        Number(variante.stock) || 0;


      if (stock <= 0) {

        alert(
          "La variante seleccionada está agotada."
        );

        return;
      }


      // --------------------------------------------------------
      // FOTO
      // --------------------------------------------------------

      const imgElement =
        document.getElementById(
          `img-prod-${idProducto}`
        );


      const foto =
        variante.imagen ||
        imgElement?.src ||
        producto.imagen ||
        "";


      // --------------------------------------------------------
      // BUSCAR MISMA VARIANTE
      // --------------------------------------------------------

      const indiceExistente =
        carrito.findIndex(
          item => esMismaVarianteCarrito(item, producto.id, variante)
        );


      // --------------------------------------------------------
      // SI YA EXISTE
      // AUMENTAR CANTIDAD
      // --------------------------------------------------------

      if (indiceExistente !== -1) {

        const item =
          carrito[indiceExistente];


        const cantidadActual =
          Number(item.cantidad) || 1;


        if (
          cantidadActual >= stock
        ) {

          alert(
            `No puedes agregar más. Solo hay ${stock} unidad(es) disponibles de esta variante.`
          );

          return;
        }


        item.cantidad =
          cantidadActual + 1;


        item.stock =
          stock;


        actualizarCarrito();

        return;
      }


      // --------------------------------------------------------
      // CREAR NUEVA LÍNEA DEL CARRITO
      // --------------------------------------------------------

      const precio =
        numero(
          variante.precio ??
          producto.precio
        );


      const productoParaCarrito = {

        ...producto,

        id:
          producto.id,

        varianteId:
          variante.id,

        sku:
          variante.sku ||
          producto.sku ||
          "",

        nombre:
          producto.nombre,

        precio:
          precio,

        precioTexto:
          formatearMoneda(
            precio
          ),

        color:
          variante.color ||
          "",

        tamanoSeleccionado:
          variante.tamano ||
          producto.tamano ||
          "",

        tallaSeleccionada:
          variante.talla ||
          "N/A",

        imagen:
          foto,

        stock:
          stock,

        cantidad:
          1

      };


      carrito.push(
        productoParaCarrito
      );


      actualizarCarrito();


      // --------------------------------------------------------
      // ABRIR CARRITO
      // --------------------------------------------------------

      const modalCart =
        document.getElementById(
          "cart-modal"
        );


      if (
        modalCart &&
        modalCart.classList.contains(
          "hidden"
        )
      ) {

        toggleCart();

      }

    }


    // ==========================================================
    // 9. ACTUALIZAR CARRITO
    // ==========================================================

    function actualizarCarrito() {

      guardarCarrito();

      const contador =
        document.getElementById("cart-count") ||
        document.getElementById("contadorCarrito");

      if (contador) {

        const totalUnidades =
          carrito.reduce(
            (total, item) =>
              total + (Number(item.cantidad) || 0),
            0
          );

        contador.innerText = totalUnidades;
      }


      const cartItems =
        document.getElementById("cart-items");

      const cartSubtotal =
        document.getElementById("cart-subtotal");

      const cartDiscount =
        document.getElementById("cart-discount");

      const cartTotal =
        document.getElementById("cart-total");


      // --------------------------------------------------------
      // SUBTOTAL
      // --------------------------------------------------------

      let subtotal = 0;

      carrito.forEach(item => {

        const precio =
          numero(item.precio);

        const cantidad =
          Number(item.cantidad) || 1;

        subtotal +=
          precio * cantidad;

      });


      // --------------------------------------------------------
      // DESCUENTO
      // --------------------------------------------------------

      const descuentoPorcentaje =
        obtenerDescuento();

      const descuento =
        subtotal * descuentoPorcentaje;


      // --------------------------------------------------------
      // TOTAL
      // --------------------------------------------------------

      const total =
        subtotal - descuento;


      // --------------------------------------------------------
      // MOSTRAR PRODUCTOS
      // --------------------------------------------------------

      if (cartItems) {

        cartItems.innerHTML = "";


        if (!carrito.length) {

          cartItems.innerHTML = `
            <div class="py-12 text-center">

              <div class="text-5xl mb-4">
                🛒
              </div>

              <h3 class="text-xl font-semibold text-gray-800">
                Tu carrito está vacío
              </h3>

              <p class="text-sm text-gray-400 mt-2">
                Agrega tus productos favoritos para continuar.
              </p>

            </div>
          `;

        } else {

          carrito.forEach((item, index) => {

            const producto =
              productos.find(
                p =>
                  Number(p.id) ===
                  Number(item.id)
              );


            // El producto puede tardar unos milisegundos en llegar desde Sheets.
            // Aun así mostramos la línea guardada para no perder el carrito.
            const productoSeguro = producto || {
              id: item.id,
              nombre: item.nombre || "Producto",
              categoria: item.categoria || "Producto",
              colores: [],
              tallas: [],
              tamanos: [],
              variantes: []
            };

            // --------------------------------------------------
            // OPCIONES REALES DEL CARRITO
            // --------------------------------------------------
            // Las opciones se derivan SIEMPRE de las variantes que
            // llegaron desde Google Sheets. Así el carrito no depende
            // de que colores[]/tallas[] hayan sido generados previamente.
            const variantesCarrito = Array.isArray(productoSeguro.variantes)
              ? productoSeguro.variantes.filter(Boolean)
              : [];

            const mapaTallasCarrito = new Map();
            const mapaColoresCarrito = new Map();

            variantesCarrito.forEach(v => {
              const talla = String(v.talla || "").trim();
              const color = String(v.color || "").trim();

              if (talla && !mapaTallasCarrito.has(talla)) {
                mapaTallasCarrito.set(talla, {
                  talla,
                  stock: 0
                });
              }
              if (talla) {
                mapaTallasCarrito.get(talla).stock += Math.max(0, Number(v.stock) || 0);
              }

              if (color && !mapaColoresCarrito.has(color)) {
                mapaColoresCarrito.set(color, {
                  nombre: color,
                  stock: 0,
                  hex: obtenerColorVisual(color)
                });
              }
              if (color) {
                mapaColoresCarrito.get(color).stock += Math.max(0, Number(v.stock) || 0);
              }
            });

            // Compatibilidad con productos antiguos/fallback.
            if (!mapaTallasCarrito.size && Array.isArray(productoSeguro.tallas)) {
              productoSeguro.tallas.forEach(t => {
                const valor = String(t?.talla ?? t ?? "").trim();
                if (valor) mapaTallasCarrito.set(valor, { talla: valor, stock: Number(t?.stock) || 0 });
              });
            }

            if (!mapaColoresCarrito.size && Array.isArray(productoSeguro.colores)) {
              productoSeguro.colores.forEach(c => {
                const nombre = String(c?.nombre || "").trim();
                if (nombre) mapaColoresCarrito.set(nombre, {
                  nombre,
                  stock: Number(c?.stock) || 0,
                  hex: obtenerColorVisual(nombre)
                });
              });
            }

            const opcionesTallaCarrito = Array.from(mapaTallasCarrito.values());
            const opcionesColorCarrito = Array.from(mapaColoresCarrito.values());


            const cantidad =
              Number(item.cantidad) || 1;


            const precio =
              numero(item.precio);


            const subtotalItem =
              precio * cantidad;


            // --------------------------------------------------
            // VARIANTE ACTUAL
            // --------------------------------------------------

            const tallaActual =
              String(
                item.tallaSeleccionada || ""
              ).trim();


            const colorActual =
              String(
                item.color || ""
              ).trim();


            // --------------------------------------------------
            // TALLAS DISPONIBLES
            // --------------------------------------------------

            let botonesTalla = "";


            if (opcionesTallaCarrito.length) {

              botonesTalla =
                opcionesTallaCarrito
                  .map(talla => {

                    const valor =
                      String(
                        talla.talla || talla || ""
                      ).trim();


                    if (!valor) {
                      return "";
                    }


                    const seleccionada =
                      valor === tallaActual;

                    // IMPORTANTE:
                    // La talla seleccionada representa la línea actual.
                    // Las demás tallas NO reemplazan esta línea: se agregan
                    // como una NUEVA línea independiente del carrito.
                    const accionTalla = seleccionada
                      ? ""
                      : `onclick="agregarTallaAlternativaCarrito(${index}, '${escaparJS(valor)}')"`;

                    return `
                      <button
                        type="button"
                        ${accionTalla}
                        class="
                          cart-variant-size
                          ${seleccionada ? "cart-variant-selected" : ""}
                        "
                        ${seleccionada ? "aria-current=\"true\"" : `title="Agregar talla ${escaparHTML(valor)}"`}
                      >
                        ${seleccionada ? escaparHTML(valor) : `+ ${escaparHTML(valor)}`}
                      </button>
                    `;

                  })
                  .join("");

            }


            // --------------------------------------------------
            // COLORES DISPONIBLES
            // --------------------------------------------------

            let botonesColor = "";


            if (opcionesColorCarrito.length) {

              botonesColor =
                opcionesColorCarrito
                  .map(color => {

                    const nombre =
                      String(
                        color.nombre || ""
                      ).trim();


                    if (!nombre) {
                      return "";
                    }


                    const seleccionado =
                      nombre === colorActual;


                    const codigo =
                      obtenerColorVisual(
                        nombre
                      );


                    return `
                      <button
                        type="button"
                        title="${escaparHTML(nombre)}"
                        aria-label="Seleccionar color ${escaparHTML(nombre)}"
                        onclick="cambiarVarianteCarrito(${index}, null, '${escaparJS(nombre)}')"
                        class="
                          cart-color-dot
                          ${seleccionado ? "cart-color-selected" : ""}
                        "
                        style="background:${escaparHTML(codigo)};"
                      >
                        ${
                          seleccionado
                            ? `<span class="cart-color-check">✓</span>`
                            : ""
                        }
                      </button>
                    `;

                  })
                  .join("");

            }


            // --------------------------------------------------
            // AGREGAR OTRA TALLA SIN REEMPLAZAR LA ACTUAL
            // --------------------------------------------------
            // Solo mostramos tallas disponibles para la combinación
            // de color/tamaño de la línea actual. Al pulsarlas se
            // crea una NUEVA línea del carrito.
            const tallasAlternativasCarrito = Array.from(
              new Set(
                variantesCarrito
                  .filter(v => {
                    const talla = String(v.talla || "").trim();
                    return (
                      talla &&
                      talla !== tallaActual &&
                      Number(v.stock) > 0
                    );
                  })
                  .map(v => String(v.talla || "").trim())
                  .filter(Boolean)
              )
            );

            const selectorTallasAlternativas =
              tallasAlternativasCarrito.length
                ? `
                  <div class="mt-3">
                    <div class="text-[10px] uppercase tracking-[0.14em] font-bold text-gray-400 mb-2">
                      Agregar otra talla
                    </div>
                    <div class="flex flex-wrap gap-2">
                      ${tallasAlternativasCarrito.map(talla => `
                        <button
                          type="button"
                          onclick="agregarTallaAlternativaCarrito(${index}, '${escaparJS(talla)}')"
                          class="cart-variant-size"
                          title="Agregar talla ${escaparHTML(talla)}"
                        >
                          + ${escaparHTML(talla)}
                        </button>
                      `).join("")}
                    </div>
                  </div>
                `
                : "";

            // SELECTORES
            // --------------------------------------------------

            const selectorTalla =
              botonesTalla
                ? `
                  <div class="mt-4">

                    <div class="
                      text-[10px]
                      uppercase
                      tracking-[0.14em]
                      font-bold
                      text-gray-500
                      mb-2
                    ">
                      Talla
                    </div>

                    <div class="flex flex-wrap gap-2">
                      ${botonesTalla}
                    </div>

                  </div>
                `
                : "";


            const selectorColor =
              botonesColor
                ? `
                  <div class="mt-4">

                    <div class="
                      text-[10px]
                      uppercase
                      tracking-[0.14em]
                      font-bold
                      text-gray-500
                      mb-2
                    ">
                      Color
                    </div>

                    <div class="flex flex-wrap gap-2">
                      ${botonesColor}
                    </div>

                    <div
                      class="
                        text-[10px]
                        text-gray-400
                        mt-2
                      "
                    >
                      ${escaparHTML(colorActual)}
                    </div>

                  </div>
                `
                : "";


            // --------------------------------------------------
            // HTML DEL PRODUCTO
            // --------------------------------------------------

            cartItems.innerHTML += `

              <div
                class="
                  cart-product-card
                  rounded-2xl
                  border
                  border-[#e8e1d7]
                  bg-[#fcfaf6]
                  p-4
                  mb-3
                "
              >

                <!-- ENCABEZADO PRODUCTO -->

                <div
                  class="
                    flex
                    items-start
                    gap-3
                  "
                >

                  <div
                    class="
                      w-[68px]
                      h-[68px]
                      rounded-xl
                      bg-[#f1ede5]
                      border
                      border-[#e4ddd2]
                      flex
                      items-center
                      justify-center
                      overflow-hidden
                      flex-shrink-0
                    "
                  >

                    <img
                      src="${escaparHTML(item.imagen || productoSeguro.imagen || "")}"
                      alt="${escaparHTML(item.nombre || "")}"
                      class="
                        w-full
                        h-full
                        object-contain
                        p-1
                      "
                      onerror="this.style.opacity='0.3'"
                    >

                  </div>


                  <div class="min-w-0 flex-1">

                    <div
                      class="
                        text-[10px]
                        uppercase
                        tracking-[0.12em]
                        font-bold
                        text-[#a48755]
                        mb-1
                      "
                    >
                      ${escaparHTML(productoSeguro.categoria || "Producto")}
                    </div>


                    <h4
                      class="
                        text-[15px]
                        font-bold
                        text-gray-800
                        leading-tight
                      "
                    >
                      ${escaparHTML(item.nombre || "")}
                    </h4>


                    ${
                      item.sku
                        ? `
                          <div
                            class="
                              text-[10px]
                              text-gray-400
                              mt-1
                            "
                          >
                            SKU: ${escaparHTML(item.sku)}
                          </div>
                        `
                        : ""
                    }

                  </div>


                  <div
                    class="
                      text-right
                      flex-shrink-0
                    "
                  >

                    <div
                      class="
                        font-bold
                        text-[15px]
                        text-[#9a712c]
                      "
                    >
                      ${formatearMoneda(precio)}
                    </div>

                    <div
                      class="
                        text-[10px]
                        text-gray-400
                        mt-1
                      "
                    >
                      c/u
                    </div>

                  </div>

                </div>


                <!-- VARIANTES -->

                ${selectorTalla}
                ${selectorTallasAlternativas}

                ${selectorColor}


                <!-- CONTROLES -->

                <div
                  class="
                    mt-5
                    pt-4
                    border-t
                    border-[#e8e1d7]
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >

                  <!-- CANTIDAD -->

                  <div
                    class="
                      flex
                      items-center
                      rounded-full
                      border
                      border-[#ddd5c9]
                      bg-white
                      overflow-hidden
                      shadow-sm
                    "
                  >

                    <button
                      type="button"
                      onclick="cambiarCantidadCarrito(${index}, -1)"
                      class="
                        w-9
                        h-9
                        flex
                        items-center
                        justify-center
                        text-lg
                        font-semibold
                        text-gray-700
                        hover:bg-[#f5f1eb]
                        active:scale-95
                        transition
                      "
                    >
                      −
                    </button>


                    <span
                      class="
                        w-8
                        text-center
                        text-sm
                        font-bold
                        text-gray-800
                      "
                    >
                      ${cantidad}
                    </span>


                    <button
                      type="button"
                      onclick="cambiarCantidadCarrito(${index}, 1)"
                      class="
                        w-9
                        h-9
                        flex
                        items-center
                        justify-center
                        text-lg
                        font-semibold
                        text-gray-700
                        hover:bg-[#f5f1eb]
                        active:scale-95
                        transition
                      "
                    >
                      +
                    </button>

                  </div>


                  <!-- SUBTOTAL -->

                  <div
                    class="
                      text-sm
                      font-bold
                      text-gray-800
                    "
                  >
                    ${formatearMoneda(subtotalItem)}
                  </div>


                  <!-- ELIMINAR -->

                  <button
                    type="button"
                    onclick="eliminarDelCarrito(${index})"
                    class="
                      text-[11px]
                      font-semibold
                      text-gray-400
                      hover:text-red-500
                      transition
                    "
                  >
                    Eliminar
                  </button>

                </div>


              </div>

            `;

          });

        }

      }


      // --------------------------------------------------------
      // RESUMEN
      // --------------------------------------------------------

      if (cartSubtotal) {

        cartSubtotal.innerText =
          formatearMoneda(subtotal);

      }


      if (cartDiscount) {

        cartDiscount.innerText =
          formatearMoneda(descuento);

      }


      if (cartTotal) {

        cartTotal.innerText =
          formatearMoneda(total);

      }

    }


    // ==========================================================
    // 10. CAMBIAR CANTIDAD
    // ==========================================================

    function cambiarCantidadCarrito(
      index,
      cambio
    ) {

      const item =
        carrito[index];

      if (!item) {
        return;
      }


      const cantidadActual =
        Number(item.cantidad) || 1;


      const nuevaCantidad =
        cantidadActual +
        Number(cambio);


      // --------------------------------------------------------
      // EL SIGNO - NUNCA ELIMINA
      // --------------------------------------------------------

      if (nuevaCantidad < 1) {

        item.cantidad = 1;

        actualizarCarrito();

        return;
      }


      const stock =
        Number(item.stock) || 0;


      if (
        stock > 0 &&
        nuevaCantidad > stock
      ) {

        mostrarMensajeCarrito(
          `Solo hay ${stock} unidad${stock === 1 ? "" : "es"} disponibles de esta variante.`
        );

        return;
      }


      item.cantidad =
        nuevaCantidad;


      actualizarCarrito();

    }


    // ==========================================================
    // 11. CAMBIAR TALLA / COLOR DESDE EL CARRITO
    // ==========================================================

    function buscarVarianteExacta(producto, talla, color, tamano) {
      if (!producto || !Array.isArray(producto.variantes)) return null;

      const limpiar = value => {
        const v = String(value ?? "").trim();
        return v === "N/A" || v === "NA" || v === "-" ? "" : v;
      };

      const t = limpiar(talla);
      const c = limpiar(color);
      const z = limpiar(tamano);
      const normal = value => String(value ?? "").trim();

      // 1. Combinación exacta, preferiblemente con stock.
      const exactaDisponible = producto.variantes.find(v =>
        normal(v.talla) === t &&
        normal(v.color) === c &&
        normal(v.tamano) === z &&
        Number(v.stock) > 0
      );
      if (exactaDisponible) return exactaDisponible;

      const exacta = producto.variantes.find(v =>
        normal(v.talla) === t &&
        normal(v.color) === c &&
        normal(v.tamano) === z
      );
      if (exacta) return exacta;

      return null;
    }

    function buscarVariantePorCambio(producto, tallaSolicitada, colorSolicitado, tamanoSolicitado, prioridad = "talla") {
      if (!producto || !Array.isArray(producto.variantes)) return null;

      const limpiar = value => {
        const v = String(value ?? "").trim();
        return v === "N/A" || v === "NA" || v === "-" ? "" : v;
      };

      const t = limpiar(tallaSolicitada);
      const c = limpiar(colorSolicitado);
      const z = limpiar(tamanoSolicitado);
      const normal = value => String(value ?? "").trim();
      const disponibles = producto.variantes.filter(v => Number(v.stock) > 0);

      const coincide = (v, usarTalla, usarColor, usarTamano) =>
        (!usarTalla || normal(v.talla) === t) &&
        (!usarColor || normal(v.color) === c) &&
        (!usarTamano || normal(v.tamano) === z);

      // Primero intentamos conservar TODA la selección actual.
      let variante = disponibles.find(v => coincide(v, true, true, true));
      if (variante) return variante;

      // Al cambiar talla: mantener color/tamaño si existe; si no,
      // elegir la primera talla disponible y actualizar color/tamaño reales.
      if (prioridad === "talla") {
        variante = disponibles.find(v => coincide(v, true, !!c, !!z));
        if (variante) return variante;
        variante = disponibles.find(v => normal(v.talla) === t && (!z || normal(v.tamano) === z));
        if (variante) return variante;
        variante = disponibles.find(v => normal(v.talla) === t);
        if (variante) return variante;
      }

      // Al cambiar color: mantener talla/tamaño si existe; si no,
      // buscar cualquier variante disponible del color solicitado.
      if (prioridad === "color") {
        variante = disponibles.find(v => coincide(v, !!t, true, !!z));
        if (variante) return variante;
        variante = disponibles.find(v => normal(v.color) === c && (!z || normal(v.tamano) === z));
        if (variante) return variante;
        variante = disponibles.find(v => normal(v.color) === c);
        if (variante) return variante;
      }

      // Tamaño se comporta como una tercera dimensión.
      if (prioridad === "tamano") {
        variante = disponibles.find(v => coincide(v, !!t, !!c, true));
        if (variante) return variante;
        variante = disponibles.find(v => normal(v.tamano) === z);
        if (variante) return variante;
      }

      return null;
    }

    function cambiarVarianteCarrito(index, nuevaTalla = null, nuevoColor = null, nuevoTamano = null) {
      const item = carrito[index];
      if (!item) return;

      const producto = productos.find(p => Number(p.id) === Number(item.id));
      if (!producto) {
        mostrarMensajeCarrito("Estamos actualizando el inventario. Intenta nuevamente en un momento.");
        return;
      }

      const cambioTalla = nuevaTalla !== null;
      const cambioColor = nuevoColor !== null;
      const cambioTamano = nuevoTamano !== null;

      const tallaActual = String(item.tallaSeleccionada || "").trim();
      const colorActual = String(item.color || "").trim();
      const tamanoActual = String(item.tamanoSeleccionado || "").trim();

      const talla = cambioTalla ? String(nuevaTalla ?? "").trim() : tallaActual;
      const color = cambioColor ? String(nuevoColor ?? "").trim() : colorActual;
      const tamano = cambioTamano ? String(nuevoTamano ?? "").trim() : tamanoActual;

      const prioridad = cambioColor ? "color" : cambioTalla ? "talla" : "tamano";
      const variante = buscarVariantePorCambio(producto, talla, color, tamano, prioridad);

      if (!variante) {
        mostrarMensajeCarrito("Esta combinación no está disponible. Elige otra opción.");
        actualizarCarrito();
        return;
      }

      const stock = Math.max(0, Number(variante.stock) || 0);
      if (stock <= 0) {
        mostrarMensajeCarrito("Esta variante está agotada.");
        actualizarCarrito();
        return;
      }

      const cantidadSolicitada = Math.max(1, Number(item.cantidad) || 1);
      const duplicado = carrito.findIndex((otro, otroIndex) =>
        otroIndex !== index &&
        esMismaVarianteCarrito(otro, item.id, variante)
      );

      if (duplicado !== -1) {
        const existente = carrito[duplicado];
        const cantidadExistente = Math.max(1, Number(existente.cantidad) || 1);

        if (cantidadExistente + cantidadSolicitada > stock) {
          mostrarMensajeCarrito(
            `Esta variante ya está en tu carrito. Solo hay ${stock} unidad${stock === 1 ? "" : "es"} disponible${stock === 1 ? "" : "s"}.`
          );
          actualizarCarrito();
          return;
        }

        existente.cantidad = cantidadExistente + cantidadSolicitada;
        existente.stock = stock;
        existente.precio = numero(variante.precio ?? producto.precio);
        existente.precioTexto = formatearMoneda(existente.precio);
        existente.imagen = variante.imagen || producto.imagen || existente.imagen || "";
        existente.color = variante.color || "";
        existente.tallaSeleccionada = variante.talla || "N/A";
        existente.tamanoSeleccionado = variante.tamano || "";
        existente.varianteId = variante.id;
        existente.sku = variante.sku || producto.sku || "";

        carrito.splice(index, 1);
        actualizarCarrito();
        return;
      }

      // La variante encontrada es la fuente de verdad. Esto permite que,
      // si una combinación exacta no existe, el carrito cambie también la
      // otra dimensión a una opción realmente disponible.
      item.varianteId = variante.id;
      item.sku = variante.sku || producto.sku || "";
      item.color = variante.color || "";
      item.tallaSeleccionada = variante.talla || "N/A";
      item.tamanoSeleccionado = variante.tamano || "";
      item.stock = stock;
      item.cantidad = Math.min(cantidadSolicitada, stock);
      item.precio = numero(variante.precio ?? producto.precio);
      item.precioTexto = formatearMoneda(item.precio);
      item.imagen = variante.imagen || producto.imagen || item.imagen || "";

      actualizarCarrito();
    }

    // ==========================================================
    // 12. AGREGAR OTRA TALLA DESDE EL CARRITO
    // ==========================================================
    function agregarTallaAlternativaCarrito(index, nuevaTalla) {
      const item = carrito[index];
      if (!item) return;

      const producto = productos.find(p => Number(p.id) === Number(item.id));
      if (!producto || !Array.isArray(producto.variantes)) {
        mostrarMensajeCarrito("Estamos actualizando el inventario. Intenta nuevamente en un momento.");
        return;
      }

      const talla = String(nuevaTalla ?? "").trim();
      const colorActual = String(item.color || "").trim();
      const tamanoActual = String(item.tamanoSeleccionado || "").trim();

      let variante = producto.variantes.find(v =>
        String(v.talla || "").trim() === talla &&
        String(v.color || "").trim() === colorActual &&
        String(v.tamano || "").trim() === tamanoActual &&
        Number(v.stock) > 0
      );

      if (!variante) {
        variante = producto.variantes.find(v =>
          String(v.talla || "").trim() === talla &&
          String(v.color || "").trim() === colorActual &&
          Number(v.stock) > 0
        );
      }

      // Si el producto no usa color/tamaño para distinguir las tallas,
      // o la variante equivalente no tiene esos datos, usamos la talla
      // disponible como último criterio.
      if (!variante) {
        variante = producto.variantes.find(v =>
          String(v.talla || "").trim() === talla &&
          Number(v.stock) > 0
        );
      }

      if (!variante) {
        mostrarMensajeCarrito("Esta talla no está disponible para la variante seleccionada.");
        actualizarCarrito();
        return;
      }

      const stock = Math.max(0, Number(variante.stock) || 0);
      if (stock <= 0) {
        mostrarMensajeCarrito("Esta talla está agotada.");
        actualizarCarrito();
        return;
      }

      const existenteIndex = carrito.findIndex((otro, otroIndex) =>
        otroIndex !== index &&
        esMismaVarianteCarrito(otro, producto.id, variante)
      );

      if (existenteIndex !== -1) {
        const existente = carrito[existenteIndex];
        const cantidadExistente = Math.max(1, Number(existente.cantidad) || 1);

        if (cantidadExistente >= stock) {
          mostrarMensajeCarrito(
            `La talla ${talla} ya está en tu carrito y solo hay ${stock} unidad${stock === 1 ? "" : "es"} disponible${stock === 1 ? "" : "s"}.`
          );
          actualizarCarrito();
          return;
        }

        existente.cantidad = cantidadExistente + 1;
        existente.stock = stock;
        existente.precio = numero(variante.precio ?? producto.precio);
        existente.precioTexto = formatearMoneda(existente.precio);
        existente.imagen = variante.imagen || producto.imagen || existente.imagen || "";
        existente.color = variante.color || "";
        existente.tallaSeleccionada = variante.talla || "N/A";
        existente.tamanoSeleccionado = variante.tamano || "";
        existente.varianteId = variante.id;
        existente.sku = variante.sku || producto.sku || "";
        actualizarCarrito();
        return;
      }

      const imagen = variante.imagen || producto.imagen || item.imagen || "";
      const precio = numero(variante.precio ?? producto.precio);

      carrito.push({
        ...producto,
        id: producto.id,
        varianteId: variante.id,
        sku: variante.sku || producto.sku || "",
        nombre: producto.nombre,
        precio,
        precioTexto: formatearMoneda(precio),
        color: variante.color || "",
        tallaSeleccionada: variante.talla || "N/A",
        tamanoSeleccionado: variante.tamano || "",
        imagen,
        stock,
        cantidad: 1
      });

      actualizarCarrito();
    }


    // ==========================================================
    // 13. COMPATIBILIDAD CON VERSIONES ANTERIORES
    // ==========================================================

    function agregarOtraVarianteCarrito(index) {
      // La interfaz actual ya no utiliza este botón.
      // Se conserva la función para evitar errores si existe
      // una referencia antigua en caché.
      actualizarCarrito();
    }


    // ==========================================================
    // 13. ELIMINAR DEL CARRITO
    // ==========================================================

    function eliminarDelCarrito(
      index
    ) {

      if (
        index < 0 ||
        index >= carrito.length
      ) {

        return;
      }


      carrito.splice(
        index,
        1
      );


      actualizarCarrito();

    }


    // ==========================================================
    // 14. COLOR VISUAL
    // ==========================================================

    function obtenerColorVisual(
      nombre
    ) {

      const color =
        String(
          nombre || ""
        )
        .trim()
        .toLowerCase();


      const colores = {

        "negro": "#111111",
        "black": "#111111",

        "blanco": "#ffffff",
        "white": "#ffffff",

        "rojo": "#c62828",
        "red": "#c62828",

        "azul": "#243b7a",
        "azul marino": "#172554",
        "navy": "#172554",

        "verde": "#285943",
        "verde oscuro": "#285943",
        "verde olivo": "#556b2f",

        "rosa": "#e8a3b5",
        "rosado": "#e8a3b5",

        "morado": "#684078",
        "violeta": "#684078",

        "cafe": "#5a3a22",
        "café": "#5a3a22",

        "beige": "#d8c7aa",
        "crema": "#eee5d5",

        "gris": "#9ca3af",
        "gris oscuro": "#4b5563",

        "amarillo": "#e2c044",

        "naranja": "#d97706",

        "celeste": "#8ecae6",

        "turquesa": "#2a9d8f"

      };


      return (
        colores[color] ||
        "#d1d5db"
      );

    }


    // ==========================================================
    // 15. MENSAJE PROFESIONAL DEL CARRITO
    // ==========================================================

    function mostrarMensajeCarrito(
      mensaje
    ) {

      let aviso =
        document.getElementById(
          "cart-toast"
        );


      if (!aviso) {

        aviso =
          document.createElement(
            "div"
          );


        aviso.id =
          "cart-toast";


        aviso.style.cssText = `
          position: fixed;
          left: 50%;
          bottom: 28px;
          transform: translateX(-50%) translateY(20px);
          z-index: 99999;
          width: min(92vw, 420px);
          padding: 15px 18px;
          border-radius: 16px;
          background: #29251f;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.45;
          text-align: center;
          box-shadow: 0 12px 35px rgba(0,0,0,.22);
          opacity: 0;
          transition: all .25s ease;
          pointer-events: none;
        `;


        document.body.appendChild(
          aviso
        );

      }


      aviso.innerText =
        mensaje;


      aviso.style.opacity =
        "1";


      aviso.style.transform =
        "translateX(-50%) translateY(0)";


      clearTimeout(
        aviso._timer
      );


      aviso._timer =
        setTimeout(() => {

          aviso.style.opacity =
            "0";


          aviso.style.transform =
            "translateX(-50%) translateY(20px)";

        }, 2800);

    }


    // ==========================================================
    // 16. ESC PARA CERRAR EL CARRITO
    // ==========================================================

    document.addEventListener(
      "keydown",
      function(event) {

        if (
          event.key !== "Escape" &&
          event.key !== "Esc"
        ) {
          return;
        }


        const modalCart =
          document.getElementById(
            "cart-modal"
          );


        if (!modalCart) {
          return;
        }


        // Solo cerrar si el carrito está visible

        if (
          !modalCart.classList.contains(
            "hidden"
          )
        ) {

          if (
            typeof toggleCart ===
            "function"
          ) {

            toggleCart();

          }

        }

      }
    );

    // ==========================================================
    // 13. ABRIR / CERRAR CARRITO
    // ==========================================================

    function toggleCart() {

      const modalCart =
        document.getElementById(
          "cart-modal"
        );


      if (modalCart) {

        modalCart.classList.toggle(
          "hidden"
        );
        modalCart.setAttribute(
          "aria-hidden",
          modalCart.classList.contains("hidden") ? "true" : "false"
        );

      }

    }

    // ==========================================================
    // 12. RENDERIZAR PRODUCTOS
    // ==========================================================

    function renderizarProductos(
      lista
    ) {

      const contenedor =
        document.getElementById(
          "product-list"
        );


      if (!contenedor) {
        return;
      }


      contenedor.innerHTML =
        "";


      if (
        !lista ||
        lista.length === 0
      ) {

        contenedor.innerHTML =
          `
            <div class="col-span-full text-center py-16 text-gray-400">

              <div class="text-4xl mb-3">
                🛍️
              </div>

              <p class="font-semibold">
                No hay productos disponibles.
              </p>

            </div>
          `;

        return;

      }


      lista.forEach(
        producto => {

          const productoId =
            Number(producto.id);


          // ----------------------------------------------------
          // BADGE GÉNERO
          // ----------------------------------------------------

          const badgeGenero =
            producto.genero
              ? `
                <span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold uppercase border border-gray-200">
                  ${escaparHTML(producto.genero)}
                </span>
              `
              : "";


          // ----------------------------------------------------
          // BADGE TAMAÑO
          // ----------------------------------------------------

          const badgeTamano =
            producto.tamano
              ? `
                <span class="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                  ${escaparHTML(producto.tamano)}
                </span>
              `
              : "";


          // ----------------------------------------------------
          // DESCRIPCIÓN
          // ----------------------------------------------------

          const htmlDescripcion =
            producto.descripcion
              ? `
                <p class="text-xs text-gray-500 mt-1 lshop-product-description">
                  ${escaparHTML(producto.descripcion)}
                </p>
              `
              : "";


          // ----------------------------------------------------
          // TALLAS
          // ----------------------------------------------------

          let htmlSelectorTallas =
            "";


          if (
            Array.isArray(
              producto.tallas
            ) &&
            producto.tallas.length > 0
          ) {

            const botonesTalla =
              producto.tallas
                .map(
                  (
                    t,
                    index
                  ) => {

                    const tVal =
                      typeof t === "object"
                        ? t.talla
                        : t;


                    const stockTalla =
                      typeof t === "object"
                        ? Number(t.stock) || 0
                        : obtenerStockPorTalla(
                            producto,
                            tVal
                          );


                    const estaAgotado =
                      stockTalla <= 0;


                    const claseEstado =
                      index === 0 &&
                      !estaAgotado

                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"

                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-500 hover:text-emerald-600";


                    const claseAgotado =
                      estaAgotado

                        ? "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 line-through"

                        : "cursor-pointer";


                    return `
                      <button
                        type="button"

                        data-talla-btn="${productoId}"

                        data-valor="${escaparHTML(tVal)}"

                        onclick="seleccionarTallaChip(${productoId}, '${escaparJS(tVal)}', this)"

                        ${estaAgotado ? "disabled" : ""}

                        class="btn-talla-${productoId} text-xs font-bold px-3 py-1 rounded-md border transition-all duration-200 uppercase ${claseEstado} ${claseAgotado}"
                      >
                        ${escaparHTML(tVal)}
                      </button>
                    `;

                  }
                )
                .join("");


            const primeraTalla =
              producto.tallas[0];


            const valorInicial =
              typeof primeraTalla === "object"
                ? primeraTalla.talla
                : primeraTalla;


            htmlSelectorTallas =
              `
                <div class="mt-3 mb-2">

                  <span class="text-[11px] font-bold tracking-wider text-gray-500 uppercase block mb-1.5">
                    Talla:
                  </span>

                  <div
                    class="flex flex-wrap gap-1.5"
                    id="contenedor-tallas-${productoId}"
                  >
                    ${botonesTalla}
                  </div>

                  <input
                    type="hidden"
                    id="select-talla-${productoId}"
                    value="${escaparHTML(valorInicial)}"
                  >

                </div>
              `;

          }


          // ----------------------------------------------------
          // ADICIÓN RÁPIDA
          // ----------------------------------------------------

          let htmlAdicionRapida =
            "";


          if (
            Array.isArray(
              producto.tallas
            ) &&
            producto.tallas.length > 0
          ) {

            const botonesTalla =
              producto.tallas
                .map(
                  t => {

                    const tVal =
                      typeof t === "object"
                        ? t.talla
                        : t;


                    return `
                      <button
                        onclick="event.stopPropagation(); seleccionarTallaRapida(${productoId}, '${escaparJS(tVal)}')"
                        class="text-xs font-bold hover:text-emerald-400 uppercase transition-colors px-1 cursor-pointer"
                      >
                        ${escaparHTML(tVal)}
                      </button>
                    `;

                  }
                )
                .join("");


            htmlAdicionRapida =
              `
                <div
                  class="absolute bottom-0 left-0 right-0 bg-black/75 text-white py-2 px-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-auto"

                  onclick="event.stopPropagation()"
                >

                  <span class="text-[10px] font-bold tracking-wider uppercase">
                    Ver Talla:
                  </span>

                  <div class="flex gap-2">
                    ${botonesTalla}
                  </div>

                </div>
              `;

          }


          // ----------------------------------------------------
          // IMAGEN
          // ----------------------------------------------------

          const imagenInicial =
            producto.imagen ||
            (
              producto.colores &&
              producto.colores[0]
                ? producto.colores[0].imagen
                : ""
            );


          const fotosIniciales =
            producto.imagenes &&
            producto.imagenes.length
              ? producto.imagenes
              : [imagenInicial];


          // ----------------------------------------------------
          // TARJETA
          // ----------------------------------------------------

          const tarjeta =
            `
              <div
                class="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col justify-between group"
              >

                <div>

                  <input
                    type="hidden"
                    id="color-seleccionado-${productoId}"
                    value=""
                  >


                  <div
                    class="relative w-full h-52 rounded overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer"
                  >

                    <img
                      id="img-prod-${productoId}"

                      src="${escaparHTML(imagenInicial)}"

                      alt="${escaparHTML(producto.nombre)}"

                      class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"

                      data-fotos="${escaparHTML(JSON.stringify(fotosIniciales))}"

                      onclick="abrirGaleriaDesdeElemento(this)"

                      onerror="manejarErrorImagen(this)"
                    >

                    ${htmlAdicionRapida}

                  </div>


                  <div class="flex items-center justify-between mt-2">

                    <span class="text-xs uppercase font-bold text-gray-400 block">
                      ${escaparHTML(producto.categoria)}
                    </span>

                    <div class="flex gap-1">
                      ${badgeGenero}
                      ${badgeTamano}
                    </div>

                  </div>


                  <h3 class="font-bold text-gray-800 text-lg mt-0.5">
                    ${escaparHTML(producto.nombre)}
                  </h3>


                  ${htmlDescripcion}


                  ${
                    producto.categoria === "Lociones" &&
                    Array.isArray(producto.notas)
                      ? `
                        <div
                          class="lshop-notes"
                          aria-label="Notas de la fragancia"
                        >
                          ${producto.notas
                            .map(
                              n =>
                                `
                                  <span class="lshop-note">
                                    <span>${escaparHTML(n[0])}</span>
                                    ${escaparHTML(n[1])}
                                  </span>
                                `
                            )
                            .join("")}
                        </div>
                      `
                      : ""
                  }


                  ${htmlSelectorTallas}


                  <!-- COLORES -->

                  <div
                    id="contenedor-colores-${productoId}"
                    class="flex items-center gap-2 mt-2 mb-1 min-h-[24px]"
                  ></div>


                  <!-- STOCK -->

                  <div
                    id="info-stock-${productoId}"
                    class="text-xs font-semibold text-gray-600 mt-1"
                  >
                  </div>


                  <!-- PRECIO -->

                  <p
                    id="precio-prod-${productoId}"
                    class="text-emerald-600 font-bold text-xl mt-1"
                  >
                    ${formatearMoneda(producto.precio)}
                  </p>

                </div>


                <div class="mt-4 flex flex-col gap-2">

                  <button
                    onclick="agregarAlCarrito(${productoId})"

                    class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                  >
                    🛒 Agregar al carrito
                  </button>


                  <a
                    href="https://wa.me/${obtenerWhatsApp()}?text=${encodeURIComponent(
                      "Hola, me interesa el producto: " +
                      producto.nombre
                    )}"

                    target="_blank"

                    rel="noopener noreferrer"

                    class="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1.5 px-3 rounded text-sm transition-colors"
                  >
                    Pedir por WhatsApp
                  </a>

                </div>

              </div>
            `;


          contenedor.innerHTML +=
            tarjeta;


          // Actualizar controles
          setTimeout(
            () =>
              actualizarVistaProducto(
                productoId
              ),
            0
          );

        }
      );

    }


    // ==========================================================
    // 13. STOCK POR TALLA
    // ==========================================================

    function obtenerStockPorTalla(
      producto,
      talla
    ) {

      if (
        !producto ||
        !Array.isArray(
          producto.variantes
        )
      ) {

        return 0;

      }


      return producto.variantes
        .filter(
          v =>
            String(
              v.talla || ""
            ).trim() ===
            String(
              talla || ""
            ).trim()
        )
        .reduce(
          (
            total,
            v
          ) =>
            total +
            (
              Number(v.stock) || 0
            ),
          0
        );

    }


    // ==========================================================
    // 14. STOCK POR COLOR
    // ==========================================================

    function obtenerStockPorColor(
      producto,
      color
    ) {

      if (
        !producto ||
        !Array.isArray(
          producto.variantes
        )
      ) {

        return 0;

      }


      return producto.variantes
        .filter(
          v =>
            String(
              v.color || ""
            ).trim() ===
            String(
              color || ""
            ).trim()
        )
        .reduce(
          (
            total,
            v
          ) =>
            total +
            (
              Number(v.stock) || 0
            ),
          0
        );

    }


    // ==========================================================
    // 15. SELECCIONAR TALLA
    // ==========================================================

    function seleccionarTallaChip(
      idProducto,
      talla,
      elementoClic
    ) {

      const inputOculto =
        document.getElementById(
          `select-talla-${idProducto}`
        );


      if (inputOculto) {

        inputOculto.value =
          talla;

      }


      const botones =
        document.querySelectorAll(
          `.btn-talla-${idProducto}`
        );


      botones.forEach(
        btn => {

          if (!btn.disabled) {

            btn.className =
              btn.className.replace(
                "bg-emerald-600 text-white border-emerald-600 shadow-sm",

                "bg-white text-gray-700 border-gray-200 hover:border-emerald-500 hover:text-emerald-600"
              );

          }

        }
      );


      if (elementoClic) {

        elementoClic.className =
          elementoClic.className.replace(
            "bg-white text-gray-700 border-gray-200 hover:border-emerald-500 hover:text-emerald-600",

            "bg-emerald-600 text-white border-emerald-600 shadow-sm"
          );

      }


      actualizarVistaProducto(
        idProducto
      );

    }


    // ==========================================================
    // 16. ACTUALIZAR PRODUCTO
    // ==========================================================

    function actualizarVistaProducto(
      idProducto
    ) {

      const producto =
        productos.find(
          p =>
            Number(p.id) ===
            Number(idProducto)
        );


      if (!producto) {
        return;
      }


      const inputTalla =
        document.getElementById(
          `select-talla-${idProducto}`
        );


      const tallaActual =
        inputTalla
          ? inputTalla.value
          : "";


      const inputColor =
        document.getElementById(
          `color-seleccionado-${idProducto}`
        );


      const colorActual =
        inputColor
          ? inputColor.value
          : "";


      const contColores =
        document.getElementById(
          `contenedor-colores-${idProducto}`
        );


      const contStock =
        document.getElementById(
          `info-stock-${idProducto}`
        );


      const imgElement =
        document.getElementById(
          `img-prod-${idProducto}`
        );


      // --------------------------------------------------------
      // COLORES
      // --------------------------------------------------------

      if (
        producto.colores &&
        producto.colores.length > 0
      ) {

        let htmlColores =
          "";


        producto.colores.forEach(
          color => {

            const fotos =
              color.imagenes &&
              color.imagenes.length
                ? color.imagenes
                : [color.imagen];


            const seleccionado =
              colorActual ===
              color.nombre;


            htmlColores +=
              `
                <button
                  type="button"

                  onclick="cambiarColorTarjeta(
                    ${Number(producto.id)},
                    '${escaparJS(color.imagen)}',
                    '${escaparJS(color.nombre)}',
                    ${escaparHTML(JSON.stringify(fotos))},
                    ${Number(color.stock) || 0}
                  )"

                  title="${escaparHTML(color.nombre)}"

                  aria-label="${escaparHTML(color.nombre)}"

                  class="w-5 h-5 rounded-full border ${
                    seleccionado
                      ? "border-emerald-600 ring-2 ring-emerald-300"
                      : "border-gray-300"
                  } shadow-sm transition-transform hover:scale-125 focus:ring-2 focus:ring-emerald-500"

                  style="background-color:${escaparHTML(color.hex || "#cccccc")};"
                >
                </button>
              `;

          }
        );


        if (contColores) {

          contColores.innerHTML =
            htmlColores;

        }


        // ---------------------------------------------
        // COLOR INICIAL
        // ---------------------------------------------

        if (!colorActual) {

          const primerColor =
            producto.colores[0];


          if (primerColor) {

            cambiarColorTarjeta(
              producto.id,
              primerColor.imagen,
              primerColor.nombre,
              primerColor.imagenes ||
                [primerColor.imagen],
              primerColor.stock
            );

          }

        }

      }


      // --------------------------------------------------------
      // STOCK
      // --------------------------------------------------------

      const variante =
        obtenerVarianteSeleccionada(
          producto
        );


      if (contStock) {

        if (variante) {

          const stock =
            Number(
              variante.stock
            ) || 0;


          if (stock > 0) {

            contStock.innerHTML =
              `
                Stock disponible:
                <strong>
                  ${stock} unid.
                </strong>
              `;

          }

          else {

            let detalle =
              "";


            if (variante.talla) {

              detalle +=
                ` en talla ${escaparHTML(variante.talla)}`;

            }


            if (variante.color) {

              detalle +=
                ` / ${escaparHTML(variante.color)}`;

            }


            contStock.innerHTML =
              `
                <span class="text-red-500 font-bold">
                  Agotado${detalle}
                </span>
              `;

          }

        }

        else {

          const stockTotal =
            producto.variantes
              ? producto.variantes.reduce(
                  (
                    total,
                    v
                  ) =>
                    total +
                    (
                      Number(v.stock) ||
                      0
                    ),
                  0
                )
              : 0;


          contStock.innerHTML =
            stockTotal > 0
              ? `
                Stock disponible:
                <strong>
                  ${stockTotal} unid.
                </strong>
              `
              : `
                <span class="text-red-500 font-bold">
                  Agotado
                </span>
              `;

        }

      }


      // --------------------------------------------------------
      // PRECIO DE LA VARIANTE
      // --------------------------------------------------------

      const precioElemento =
        document.getElementById(`precio-prod-${idProducto}`);

      if (precioElemento) {
        const precioSeleccionado =
          variante
            ? numero(variante.precio)
            : numero(producto.precio);

        precioElemento.textContent =
          formatearMoneda(precioSeleccionado);
      }


      // --------------------------------------------------------
      // FOTO DE LA VARIANTE
      // --------------------------------------------------------

      if (
        variante &&
        variante.imagen &&
        imgElement
      ) {

        imgElement.src =
          variante.imagen;


        const fotos =
          variante.imagenes &&
          variante.imagenes.length
            ? variante.imagenes
            : [variante.imagen];


        imgElement.setAttribute(
          "data-fotos",
          JSON.stringify(fotos)
        );

      }

    }


    // ==========================================================
    // 17. CAMBIAR COLOR
    // ==========================================================

    function cambiarColorTarjeta(
      idProducto,
      nuevaImagen,
      nombreColor,
      fotosVariante,
      stockColor = null
    ) {

      const imgElement =
        document.getElementById(
          `img-prod-${idProducto}`
        );


      const colorInput =
        document.getElementById(
          `color-seleccionado-${idProducto}`
        );


      const contStock =
        document.getElementById(
          `info-stock-${idProducto}`
        );


      // --------------------------------------------------------
      // COLOR
      // --------------------------------------------------------

      if (colorInput) {

        colorInput.value =
          nombreColor;

      }


      // --------------------------------------------------------
      // IMAGEN
      // --------------------------------------------------------

      if (imgElement) {

        imgElement.src =
          nuevaImagen;


        const listaFotos =
          Array.isArray(
            fotosVariante
          )
            ? fotosVariante
            : [nuevaImagen];


        imgElement.setAttribute(
          "data-fotos",
          JSON.stringify(
            listaFotos
          )
        );

      }


      // --------------------------------------------------------
      // ACTUALIZAR STOCK REAL
      // --------------------------------------------------------

      const producto =
        productos.find(
          p =>
            Number(p.id) ===
            Number(idProducto)
        );


      if (
        producto &&
        contStock
      ) {

        const variante =
          obtenerVarianteSeleccionada(
            producto
          );


        if (variante) {

          const stock =
            Number(
              variante.stock
            ) || 0;


          contStock.innerHTML =
            stock > 0

              ? `
                Stock disponible:
                <strong>
                  ${stock} unid.
                </strong>
              `

              : `
                <span class="text-red-500 font-bold">
                  Agotado
                </span>
              `;

        }

        else if (
          stockColor !== null
        ) {

          contStock.innerHTML =
            `
              Stock disponible:
              <strong>
                ${Number(stockColor) || 0} unid.
              </strong>
            `;

        }

      }


      // Volver a pintar los círculos para marcar selección.
      actualizarVistaColores(
        producto
      );

    }


    // ==========================================================
    // 18. ACTUALIZAR CÍRCULOS DE COLOR
    // ==========================================================

    function actualizarVistaColores(
      producto
    ) {

      if (!producto) {
        return;
      }


      const contenedor =
        document.getElementById(
          `contenedor-colores-${producto.id}`
        );


      if (!contenedor) {
        return;
      }


      const inputColor =
        document.getElementById(
          `color-seleccionado-${producto.id}`
        );


      const colorActual =
        inputColor
          ? inputColor.value
          : "";


      contenedor
        .querySelectorAll("button")
        .forEach(
          btn => {

            const titulo =
              btn.getAttribute(
                "title"
              );


            if (
              titulo ===
              colorActual
            ) {

              btn.classList.add(
                "ring-2",
                "ring-emerald-300",
                "border-emerald-600"
              );

            }

            else {

              btn.classList.remove(
                "ring-2",
                "ring-emerald-300",
                "border-emerald-600"
              );

            }

          }
        );

    }


    // ==========================================================
    // 19. SELECCIÓN RÁPIDA DE TALLA
    // ==========================================================

    function seleccionarTallaRapida(
      idProducto,
      talla
    ) {

      const botonCorrespondiente =
        document.querySelector(
          `button[data-talla-btn="${idProducto}"][data-valor="${CSS.escape(talla)}"]`
        );


      if (botonCorrespondiente) {

        seleccionarTallaChip(
          idProducto,
          talla,
          botonCorrespondiente
        );

      }

      else {

        const inputOculto =
          document.getElementById(
            `select-talla-${idProducto}`
          );


        if (inputOculto) {

          inputOculto.value =
            talla;


          actualizarVistaProducto(
            idProducto
          );

        }

      }

    }


    // ==========================================================
    // 20. GALERÍA DESDE IMAGEN
    // ==========================================================

    function abrirGaleriaDesdeElemento(
      imgElement
    ) {

      const fotosAtributo =
        imgElement.getAttribute(
          "data-fotos"
        );


      let listaFotos =
        [imgElement.src];


      if (fotosAtributo) {

        try {

          listaFotos =
            JSON.parse(
              fotosAtributo
            );


        }

        catch (error) {

          listaFotos =
            [imgElement.src];

        }

      }


      abrirGaleria(
        listaFotos
      );

    }


    // ==========================================================
    // 21. ABRIR GALERÍA
    // ==========================================================

    function abrirGaleria(
      listaImagenes
    ) {

      const modal =
        document.getElementById(
          "modalGaleria"
        );


      const imgPrincipal =
        document.getElementById(
          "imagenPrincipalModal"
        );


      const miniaturas =
        document.getElementById(
          "contenedorMiniaturas"
        );


      if (
        !modal ||
        !imgPrincipal
      ) {

        return;

      }


      let fotos =
        Array.isArray(
          listaImagenes
        )
          ? listaImagenes.filter(Boolean)
          : [listaImagenes];


      if (
        fotos.length === 0
      ) {

        return;

      }


      imgPrincipal.src =
        fotos[0];


      if (miniaturas) {

        miniaturas.innerHTML =
          "";


        fotos.forEach(
          (url, index) => {

            miniaturas.innerHTML +=
              `
                <img
                  src="${escaparHTML(url)}"

                  onclick="document.getElementById('imagenPrincipalModal').src='${escaparJS(url)}'"

                  class="w-16 h-16 object-contain rounded border-2 border-gray-200 hover:border-emerald-500 cursor-pointer transition-all"

                  alt="Imagen ${index + 1}"

                  onerror="this.style.display='none'"
                >
              `;

          }
        );

      }


      modal.classList.remove(
        "hidden"
      );

    }


    // ==========================================================
    // 22. CERRAR GALERÍA
    // ==========================================================

    function cerrarGaleria() {

      const modal =
        document.getElementById(
          "modalGaleria"
        );


      if (modal) {

        modal.classList.add(
          "hidden"
        );

      }

    }


    // ==========================================================
    // 23. FILTRAR POR CATEGORÍA
    // ==========================================================

    function filterCategory(
      categoria
    ) {

      const catBuscada =
        String(
          categoria || ""
        )
          .toLowerCase()
          .trim();


      if (
        catBuscada ===
        "todos"
      ) {

        renderizarProductos(
          productos
        );

        return;

      }


      const filtrados =
        productos.filter(
          producto => {

            const catProducto =
              String(
                producto.categoria ||
                ""
              )
                .toLowerCase()
                .trim();


            return (
              catProducto.includes(
                catBuscada
              ) ||
              catBuscada.includes(
                catProducto
              )
            );

          }
        );


      renderizarProductos(
        filtrados
      );

    }


    // ==========================================================
    // 24. BÚSQUEDA
    // ==========================================================

    function buscarProductos() {

      const inputBusqueda =
        document.getElementById(
          "inputBuscador"
        ) ||
        document.getElementById(
          "search-input"
        );


      if (!inputBusqueda) {
        return;
      }


      const texto =
        inputBusqueda.value
          .toLowerCase()
          .trim();


      if (!texto) {

        renderizarProductos(
          productos
        );

        return;

      }


      const resultados =
        productos.filter(
          producto => {

            const nombre =
              String(
                producto.nombre ||
                ""
              )
                .toLowerCase();


            const categoria =
              String(
                producto.categoria ||
                ""
              )
                .toLowerCase();


            const genero =
              String(
                producto.genero ||
                ""
              )
                .toLowerCase();


            return (
              nombre.includes(texto) ||
              categoria.includes(texto) ||
              genero.includes(texto)
            );

          }
        );


      renderizarProductos(
        resultados
      );

    }


    // ==========================================================
    // 25. OBTENER DATOS DEL CLIENTE
    // ==========================================================

    function obtenerDatosCliente() {

      const nombre =
        document.getElementById(
          "cliente-nombre"
        )?.value.trim() || "";


      const telefono =
        document.getElementById(
          "cliente-telefono"
        )?.value.trim() || "";


      const direccion =
        document.getElementById(
          "cliente-direccion"
        )?.value.trim() || "";


      return {

        nombre,
        telefono,
        direccion

      };

    }


    // ==========================================================
    // 26. VALIDAR DATOS DEL CLIENTE
    // ==========================================================

    function validarDatosCliente() {

      const datos =
        obtenerDatosCliente();


      if (!datos.nombre) {

        alert(
          "Por favor escribe tu nombre completo."
        );


        document.getElementById(
          "cliente-nombre"
        )?.focus();


        return false;

      }


      if (!datos.telefono) {

        alert(
          "Por favor escribe tu teléfono de contacto."
        );


        document.getElementById(
          "cliente-telefono"
        )?.focus();


        return false;

      }


      if (!datos.direccion) {

        alert(
          "Por favor escribe tu dirección o ciudad."
        );


        document.getElementById(
          "cliente-direccion"
        )?.focus();


        return false;

      }


      return true;

    }


    // ==========================================================
    // 27. CALCULAR TOTALES
    // ==========================================================

    function calcularTotales() {

      const subtotal = carrito.reduce(
        (total, producto) =>
          total + numero(producto.precio) * (Number(producto.cantidad) || 1),
        0
      );

      const porcentaje = obtenerDescuento();
      const descuento = subtotal * porcentaje;
      const total = subtotal - descuento;

      return { subtotal, descuento, total, porcentaje };
    }


    // ==========================================================
    // 28. REGISTRAR VENTA EN GOOGLE SHEETS
    // ==========================================================

    async function registrarVentaEnGoogleSheets() {

      if (
        carrito.length === 0
      ) {

        return {

          ok: false,

          error:
            "El carrito está vacío."

        };

      }


      const cliente =
        obtenerDatosCliente();


      const totales =
        calcularTotales();


      const productosVenta =
        carrito.map(
          producto => {

            return {

              id:
                producto.varianteId ||
                producto.id,

              sku:
                producto.sku || "",

              nombre:
                producto.nombre || "",

              talla:
                producto.tallaSeleccionada || "",

              color:
                producto.color || "",

              tamano:
                producto.tamanoSeleccionado ||
                producto.tamano ||
                "",

              cantidad:
                Number(producto.cantidad) || 1,

              precio:
                numero(
                  producto.precio
                )

            };

          }
        );


      const firmaCheckout =
        crearFirmaCheckout(productosVenta);

      let checkout =
        obtenerPedidoCheckout(firmaCheckout);

      // Si este navegador ya había intentado la misma compra, confirmar
      // primero si el servidor la registró antes de reenviarla.
      if (checkout.esReintento) {
        const verificacion =
          await verificarPedidoEnGoogleSheets(checkout.pedido);

        if (verificacion?.ok && verificacion.encontrado) {
          const estado = String(verificacion.estado || "").trim().toLowerCase();

          if (estado === "pendiente" || estado === "confirmado") {
            limpiarPedidoCheckoutPendiente(checkout.pedido);
            return {
              ok: true,
              pedido: checkout.pedido,
              total: verificacion.total,
              descuento: verificacion.descuento,
              repetido: true,
              mensaje: "El pedido ya había sido registrado."
            };
          }

          // Una reserva vencida o cancelada ya no representa una compra
          // activa; el siguiente envío debe abrir un intento nuevo.
          limpiarPedidoCheckoutPendiente(checkout.pedido);
          checkout = obtenerPedidoCheckout(firmaCheckout);
        }
      }

      const pedido = checkout.pedido;


      const datos =
        {

          accion:
            "registrarVenta",

          pedido:
            pedido,

          cliente:
            cliente.nombre,

          telefono:
            cliente.telefono,

          direccion:
            cliente.direccion,

          totalPedido:
            totales.total,

          estado:
            configuracion.estado_inicial_pedido ||
            "Pendiente",

          notas:
            "",

          productos:
            productosVenta

        };


      try {

        const respuesta =
          await fetch(
            API_URL,
            {

              method:
                "POST",

              headers:
                {
                  "Content-Type":
                    "text/plain;charset=utf-8"
                },

              body:
                JSON.stringify(
                  datos
                )

            }
          );

        if (!respuesta.ok) {
          throw new Error(
            "El servidor de inventario no respondió correctamente."
          );
        }

        const resultado =
          await respuesta.json();

        console.log(
          "LSHOP — resultado registrarVenta:",
          resultado
        );

        // CONTRATO DE SEGURIDAD:
        // Una respuesta sin la versión exacta se considera antigua o
        // incompatible y JAMÁS puede habilitar WhatsApp.
        if (resultado.version !== LSHOP_API_VERSION) {
          return {
            ok: false,
            error:
              "La conexión con inventario usa una versión antigua. Actualiza la implementación de Apps Script antes de continuar."
          };
        }

        if (resultado.ok === true) {
          limpiarPedidoCheckoutPendiente(pedido);
        }

        return resultado;

      }

      catch (error) {

        console.error(
          "LSHOP — error registrando venta:",
          error
        );


        return {

          ok: false,

          error:
            error.message ||
            String(error)

        };

      }

    }


    // ==========================================================
    // 29. GENERAR PEDIDO LOCAL
    // ==========================================================

    function generarNumeroPedidoLocal() {

      const ahora =
        new Date();


      const fecha =
        [
          ahora.getFullYear(),

          String(
            ahora.getMonth() + 1
          ).padStart(
            2,
            "0"
          ),

          String(
            ahora.getDate()
          ).padStart(
            2,
            "0"
          )

        ].join("");


      const hora =
        [
          String(
            ahora.getHours()
          ).padStart(
            2,
            "0"
          ),

          String(
            ahora.getMinutes()
          ).padStart(
            2,
            "0"
          ),

          String(
            ahora.getSeconds()
          ).padStart(
            2,
            "0"
          )

        ].join("");


      const milisegundos = String(ahora.getMilliseconds()).padStart(3, "0");
      const aleatorio =
        globalThis.crypto?.getRandomValues
          ? Array.from(globalThis.crypto.getRandomValues(new Uint32Array(1)))[0]
              .toString(36)
          : Math.floor(Math.random() * 0x100000000).toString(36);

      return "LS-" + fecha + "-" + hora + milisegundos + "-" + aleatorio;

    }


    // ==========================================================
    // 30. ENVIAR PEDIDO A WHATSAPP
    // ==========================================================

    async function enviarPedidoWhatsApp() {

      if (
        carrito.length === 0
      ) {

        alert(
          "Tu carrito está vacío. Agrega productos antes de enviar la orden."
        );

        return;

      }


      // --------------------------------------------------------
      // DATOS CLIENTE
      // --------------------------------------------------------

      if (
        !validarDatosCliente()
      ) {

        return;

      }


      // --------------------------------------------------------
      // TOTALES
      // --------------------------------------------------------

      const totales =
        calcularTotales();


      const cliente =
        obtenerDatosCliente();


      // --------------------------------------------------------
      // REGISTRAR VENTA
      // --------------------------------------------------------

      const boton =
        document.querySelector(
          '#cart-modal button[onclick="enviarPedidoWhatsApp()"]'
        );


      if (boton) {

        boton.disabled =
          true;

        boton.dataset.textoOriginal =
          boton.innerText;

        boton.innerText =
          "Registrando pedido...";

      }


      let resultadoVenta =
        null;


      try {

        resultadoVenta =
          await registrarVentaEnGoogleSheets();

      }

      catch (error) {

        console.error(
          error
        );

      }


      if (boton) {

        boton.disabled =
          false;

        boton.innerText =
          boton.dataset.textoOriginal ||
          "Enviar pedido por WhatsApp";

      }


      // --------------------------------------------------------
      // SEGURIDAD: NO ENVIAR NI VACIAR SI SHEETS FALLÓ
      // --------------------------------------------------------

      if (!resultadoVenta || resultadoVenta.ok !== true) {
        alert(
          "No se pudo registrar el pedido. No se abrió WhatsApp y tu carrito se conserva.\n\n" +
          (resultadoVenta?.error || "Intenta nuevamente en unos segundos.")
        );
        return;
      }

      // --------------------------------------------------------
      // PEDIDO
      // --------------------------------------------------------

      const numeroPedido =
        resultadoVenta.pedido ||
        generarNumeroPedidoLocal();


      let mensaje =
        "¡Hola! Quisiera realizar el siguiente pedido:\n\n";


      // --------------------------------------------------------
      // CLIENTE
      // --------------------------------------------------------

      mensaje +=
        "*Datos del cliente:*\n";


      mensaje +=
        `Nombre: ${cliente.nombre}\n`;


      mensaje +=
        `Teléfono: ${cliente.telefono}\n`;


      mensaje +=
        `Dirección/Ciudad: ${cliente.direccion}\n\n`;


      mensaje +=
        `*Pedido:* ${numeroPedido}\n\n`;


      // --------------------------------------------------------
      // PRODUCTOS
      // --------------------------------------------------------

      carrito.forEach(
        (
          producto,
          index
        ) => {

          const precio =
            numero(
              producto.precio
            );


          const detalles =
            [];


          if (
            producto.sku
          ) {

            detalles.push(
              `SKU: ${producto.sku}`
            );

          }


          if (
            producto.color
          ) {

            detalles.push(
              `Color: ${producto.color}`
            );

          }


          if (
            producto.tallaSeleccionada &&
            producto.tallaSeleccionada !==
              "N/A"
          ) {

            detalles.push(
              `Talla: ${producto.tallaSeleccionada}`
            );

          }

          if (producto.tamanoSeleccionado || producto.tamano) {
            detalles.push(
              `Tamaño: ${producto.tamanoSeleccionado || producto.tamano}`
            );
          }


          const detalleTexto =
            detalles.length
              ? ` (${detalles.join(", ")})`
              : "";


          mensaje +=
            `*${index + 1}.* ${producto.nombre}${detalleTexto}\n`;


          const cantidad = Number(producto.cantidad) || 1;

          mensaje +=
            `Cantidad: ${cantidad}\n`;


          mensaje +=
            `Precio unitario: ${formatearMoneda(precio)}\n`;

          mensaje +=
            `Subtotal: ${formatearMoneda(precio * cantidad)}\n\n`;

        }
      );


      // --------------------------------------------------------
      // TOTALES
      // --------------------------------------------------------

      mensaje +=
        `*Subtotal:* ${formatearMoneda(totales.subtotal)}\n`;


      if (
        totales.porcentaje > 0
      ) {

        mensaje +=
          `*Descuento (${Math.round(totales.porcentaje * 100)}%):* -${formatearMoneda(totales.descuento)}\n`;

      }


      mensaje +=
        `*Total:* ${formatearMoneda(totales.total)}\n`;


      mensaje +=
        "\nQuedo a la espera de sus datos para el pago y envío.";


      // --------------------------------------------------------
      // WHATSAPP
      // --------------------------------------------------------

      const telefono =
        obtenerWhatsApp();


      const url =
        `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;


      window.open(
        url,
        "_blank"
      );


      // --------------------------------------------------------
      // PEDIDO REGISTRADO: LIMPIAR CARRITO
      // --------------------------------------------------------

      carrito = [];
      actualizarCarrito();

      const modalCart = document.getElementById("cart-modal");
      if (modalCart) {
        modalCart.classList.add("hidden");
      }

      // Actualizar el stock de la tienda inmediatamente.
      cargarDatosDesdeGoogleSheets({ silencioso: true });

    }


    // ==========================================================
    // 31. INICIALIZACIÓN
    // ==========================================================

    document.addEventListener(
      "DOMContentLoaded",
      () => {

        cargarDatosDesdeGoogleSheets();

        actualizarCarrito();

        // Comprobar cambios en Google Sheets cada 30 segundos.
        // La actualización es silenciosa y solo vuelve a renderizar si cambió algo.
        if (!intervaloActualizacion) {
          intervaloActualizacion = setInterval(() => {
            cargarDatosDesdeGoogleSheets({ silencioso: true });
          }, 30000);
        }

        // Al volver a la pestaña, comprobar inmediatamente.
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) {
            cargarDatosDesdeGoogleSheets({ silencioso: true });
          }
        });


        // ------------------------------------------------------
        // BUSCADOR
        // ------------------------------------------------------

        const inputBusqueda =
          document.getElementById(
            "inputBuscador"
          ) ||
          document.getElementById(
            "search-input"
          );


        if (inputBusqueda) {

          inputBusqueda.addEventListener(
            "input",
            buscarProductos
          );

        }


        // ------------------------------------------------------
        // CERRAR GALERÍA AL HACER CLICK FUERA
        // ------------------------------------------------------

        const modalGaleria =
          document.getElementById(
            "modalGaleria"
          );


        if (modalGaleria) {

          modalGaleria.addEventListener(
            "click",
            event => {

              if (
                event.target ===
                modalGaleria
              ) {

                cerrarGaleria();

              }

            }
          );

        }

      }
    );


    // ==========================================================
    // 32. ERROR DE IMAGEN
    // ==========================================================

    function manejarErrorImagen(
      imagen
    ) {

      if (!imagen) {
        return;
      }


      // Evitar ciclo infinito
      imagen.onerror =
        null;


      imagen.style.opacity =
        "0.35";


      imagen.style.objectFit =
        "contain";


      console.warn(
        "LSHOP — No se pudo cargar imagen:",
        imagen.src
      );

    }


    // ==========================================================
    // 33. LIMPIEZA VISUAL DE TARJETAS
    // ==========================================================

    function lshopCleanProductCards() {

      const cards =
        document.querySelectorAll(
          "#product-list > div"
        );


      cards.forEach(
        card => {

          [
            ...card.children
          ]
          .forEach(
            el => {

              const text =
                (
                  el.textContent ||
                  ""
                ).trim();


              const rect =
                el.getBoundingClientRect();


              const cs =
                getComputedStyle(
                  el
                );


              const isEmpty =
                !text &&
                !el.querySelector(
                  "img,button,input,select,svg"
                );


              if (
                isEmpty &&
                rect.height > 24 &&
                (
                  cs.backgroundColor ===
                    "rgb(255, 255, 255)" ||
                  el.className.includes(
                    "bg-white"
                  )
                )
              ) {

                el.style.display =
                  "none";

              }

            }
          );


          // Mantener botones abajo
          const buttons =
            [
              ...card.querySelectorAll(
                "button"
              )
            ];


          buttons.forEach(
            button => {

              if (
                (
                  button.textContent ||
                  ""
                )
                .toLowerCase()
                .includes(
                  "agregar"
                )
              ) {

                button.style.marginTop =
                  "8px";

              }

            }
          );

        }
      );

    }


    // ==========================================================
    // 34. EJECUTAR LIMPIEZA VISUAL
    // ==========================================================

    document.addEventListener(
      "DOMContentLoaded",
      () => {

        requestAnimationFrame(
          () =>
            lshopCleanProductCards()
        );

      }
    );
