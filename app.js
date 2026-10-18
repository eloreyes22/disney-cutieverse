
/* ==========================================
   DISNEY CUTIEVERSE
   CONSUMO DE API PÚBLICA
   CATÁLOGO, BÚSQUEDA Y PAGINACIÓN
========================================== */

// CONFIGURACIÓN DE LA API

const API_URL = "https://api.disneyapi.dev/character";
const TAMANO_PAGINA = 24;


// ELEMENTOS DEL HTML

const grid = document.getElementById("characters-grid");
const buscador = document.getElementById("search-input");
const botonBuscar = document.getElementById("search-btn");
const resultadosInfo = document.getElementById("results-info");
const paginacion = document.getElementById("pagination");

const apiStatus = document.getElementById("api-status");
const apiTime = document.getElementById("api-time");
const apiJson = document.getElementById("api-json");

const heroImage = document.getElementById("hero-image");


// ESTADO DE LA APLICACIÓN

let paginaActual = 0;
let totalPaginas = null;
let busquedaActual = "";
let cargando = false;
let hayMasPaginas = true;
let cantidadMostrada = 0;

let versionBusqueda = 0;
let controladorActual = null;
let temporizadorBusqueda = null;

const personajesMostrados = new Set();


/* ==========================================
   NORMALIZAR DATOS DE LA API
========================================== */

function obtenerLista(datos) {

    if (Array.isArray(datos)) {
        return datos;
    }

    if (datos && typeof datos === "object") {
        return [datos];
    }

    return [];
}


/* ==========================================
   CREAR TARJETAS DE PERSONAJES
========================================== */

function crearTarjeta(personaje) {

    const tarjeta = document.createElement("article");
    tarjeta.className = "character-card";

    // IMAGEN

    const imagenContenedor = document.createElement("div");
    imagenContenedor.className = "character-image";

    if (personaje.imageUrl) {

        const imagen = document.createElement("img");

        imagen.src = personaje.imageUrl;
        imagen.alt = personaje.name || "Personaje Disney";
        imagen.loading = "lazy";

        imagen.onerror = () => {
            imagenContenedor.replaceChildren();
            imagenContenedor.textContent = "✨";
        };

        imagenContenedor.appendChild(imagen);

    } else {

        imagenContenedor.textContent = "♡";
    }

    // INFORMACIÓN

    const informacion = document.createElement("div");
    informacion.className = "character-info";

    const nombre = document.createElement("h3");
    nombre.textContent = personaje.name || "Sin nombre";

    const aparicion = document.createElement("p");

    if (personaje.films?.length > 0) {

        aparicion.textContent =
            "🎬 " + personaje.films[0];

    } else if (personaje.tvShows?.length > 0) {

        aparicion.textContent =
            "📺 " + personaje.tvShows[0];

    } else if (personaje.shortFilms?.length > 0) {

        aparicion.textContent =
            "🎞️ " + personaje.shortFilms[0];

    } else if (personaje.videoGames?.length > 0) {

        aparicion.textContent =
            "🎮 " + personaje.videoGames[0];

    } else {

        aparicion.textContent = "✨ Personaje Disney";
    }

    informacion.appendChild(nombre);
    informacion.appendChild(aparicion);

    tarjeta.appendChild(imagenContenedor);
    tarjeta.appendChild(informacion);

    return tarjeta;
}


/* ==========================================
   MOSTRAR CONTADOR DE RESULTADOS
========================================== */

function actualizarContador() {

    if (cantidadMostrada === 0) {

        resultadosInfo.textContent =
            "No encontramos personajes con ese nombre ♡";

        return;
    }

    const paginas = totalPaginas === null
        ? "..."
        : totalPaginas;

    resultadosInfo.textContent =
        `✨ ${cantidadMostrada} personajes cargados | ` +
        `Página ${paginaActual} de ${paginas}`;
}


/* ==========================================
   CONTROL DE PAGINACIÓN
========================================== */

function actualizarPaginacion() {

    paginacion.replaceChildren();

    if (cargando) {

        const mensaje = document.createElement("p");

        mensaje.textContent = "Cargando más magia... ✨";

        paginacion.appendChild(mensaje);

        return;
    }

    if (!hayMasPaginas) {

        if (cantidadMostrada > 0) {

            const mensaje = document.createElement("p");

            mensaje.textContent =
                "♡ Has llegado al final del catálogo";

            paginacion.appendChild(mensaje);
        }

        return;
    }

    const boton = document.createElement("button");

    boton.textContent = "Cargar más personajes ↓";

    boton.addEventListener("click", cargarMasPersonajes);

    paginacion.appendChild(boton);
}


/* ==========================================
   CONSUMIR API CON FETCH
========================================== */

async function cargarMasPersonajes() {

    if (cargando || !hayMasPaginas) {
        return;
    }

    cargando = true;

    const version = versionBusqueda;
    const siguientePagina = paginaActual + 1;

    // CONSTRUIR URL

    const parametros = new URLSearchParams({
        page: siguientePagina,
        pageSize: TAMANO_PAGINA
    });

    if (busquedaActual !== "") {
        parametros.set("name", busquedaActual);
    }

    const url = `${API_URL}?${parametros.toString()}`;

    // CONTROLAR PETICIONES ANTERIORES

    const controlador = new AbortController();

    controladorActual = controlador;

    actualizarPaginacion();

    apiStatus.textContent = "Realizando petición HTTP GET...";

    const inicio = performance.now();

    try {

        // PETICIÓN GET

        const respuesta = await fetch(url, {
            signal: controlador.signal
        });

        // CONVERTIR RESPUESTA A JSON

        const datos = await respuesta.json();

        const tiempo =
            (performance.now() - inicio).toFixed(2);

        // IGNORAR RESPUESTAS ANTIGUAS

        if (version !== versionBusqueda) {
            return;
        }

        // VERIFICAR ESTADO HTTP

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP: ${respuesta.status}`
            );
        }

        if (datos.error) {

            throw new Error(
                datos.error.info || "Error de Disney API"
            );
        }

        // OBTENER PERSONAJES

        const personajes = obtenerLista(datos.data);

        paginaActual = siguientePagina;

        const paginasAPI = Number(datos.info?.totalPages);

        totalPaginas = Number.isFinite(paginasAPI)
            ? paginasAPI
            : null;

        // CREAR LAS TARJETAS

        personajes.forEach(personaje => {

            const id = personaje._id ?? personaje.name;

            if (id == null || personajesMostrados.has(id)) {
                return;
            }

            personajesMostrados.add(id);

            const tarjeta = crearTarjeta(personaje);

            grid.appendChild(tarjeta);

            cantidadMostrada++;
        });

        // COMPROBAR SI HAY MÁS PÁGINAS

        if (personajes.length === 0) {

            hayMasPaginas = false;

        } else if (totalPaginas !== null) {

            hayMasPaginas = paginaActual < totalPaginas;

        } else {

            hayMasPaginas = Boolean(datos.info?.nextPage);
        }

        actualizarContador();

        // MOSTRAR DATOS DE LA PETICIÓN

        apiStatus.textContent =
            `GET | HTTP ${respuesta.status} | ` +
            `Página ${paginaActual}`;

        apiTime.textContent =
            `Tiempo de respuesta: ${tiempo} ms`;

        apiJson.textContent =
            JSON.stringify(datos, null, 2);

        console.log("URL consultada:", url);
        console.log("Respuesta de Disney API:", datos);

    } catch (error) {

        if (version !== versionBusqueda) {
            return;
        }

        if (error.name === "AbortError") {
            return;
        }

        console.error("Error al consumir la API:", error);

        apiStatus.textContent = "Error en la petición HTTP";

        apiTime.textContent =
            "No se pudo completar la consulta.";

        apiJson.textContent = error.message;

        resultadosInfo.textContent =
            "No se pudo cargar el catálogo. " +
            "Puedes intentar nuevamente ♡";

    } finally {

        if (version === versionBusqueda) {

            cargando = false;
            controladorActual = null;

            actualizarPaginacion();
        }
    }
}


/* ==========================================
   REINICIAR CATÁLOGO Y BÚSQUEDAS
========================================== */

function iniciarBusqueda(texto = "") {

    versionBusqueda++;

    // CANCELAR PETICIÓN ANTERIOR

    if (controladorActual) {
        controladorActual.abort();
    }

    busquedaActual = texto.trim();

    paginaActual = 0;
    totalPaginas = null;

    cantidadMostrada = 0;
    cargando = false;
    hayMasPaginas = true;

    personajesMostrados.clear();

    grid.replaceChildren();
    grid.scrollTop = 0;

    if (busquedaActual) {

        resultadosInfo.textContent =
            `Buscando "${busquedaActual}"... ♡`;

    } else {

        resultadosInfo.textContent =
            "Explorando el mundo Disney... ✨";
    }

    cargarMasPersonajes();
}


/* ==========================================
   BUSCADOR DE PERSONAJES
========================================== */

// BÚSQUEDA AUTOMÁTICA AL ESCRIBIR

buscador.addEventListener("input", () => {

    clearTimeout(temporizadorBusqueda);

    temporizadorBusqueda = setTimeout(() => {

        iniciarBusqueda(buscador.value);

    }, 500);
});


// BÚSQUEDA AL PRESIONAR EL BOTÓN

botonBuscar.addEventListener("click", () => {

    clearTimeout(temporizadorBusqueda);

    iniciarBusqueda(buscador.value);
});


// BÚSQUEDA CON LA TECLA ENTER

buscador.addEventListener("keydown", (evento) => {

    if (evento.key === "Enter") {

        clearTimeout(temporizadorBusqueda);

        iniciarBusqueda(buscador.value);
    }
});


/* ==========================================
   CARGAR MÁS AL DESLIZAR
========================================== */

grid.addEventListener("scroll", () => {

    const distanciaRestante =
        grid.scrollHeight -
        grid.scrollTop -
        grid.clientHeight;

    if (distanciaRestante < 250) {

        cargarMasPersonajes();
    }
});


/* ==========================================
   CARGAR IMAGEN DE STITCH EN LA PORTADA
========================================== */

async function cargarPortada() {

    try {

        const url = `${API_URL}?name=Stitch`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        const personajes = obtenerLista(datos.data);

        const stitch = personajes.find(personaje =>
            personaje.name?.toLowerCase() === "stitch"
        );

        if (!stitch?.imageUrl) {
            return;
        }

        const imagen = document.createElement("img");

        imagen.src = stitch.imageUrl;
        imagen.alt = "Stitch";

        imagen.onerror = () => {
            imagen.remove();
        };

        heroImage.replaceChildren(imagen);

    } catch (error) {

        console.error(
            "No se pudo cargar la imagen de Stitch:",
            error
        );
    }
}


/* ==========================================
   INICIAR DISNEY CUTIEVERSE
========================================== */

cargarPortada();
iniciarBusqueda();
