
/* ==========================================
   DISNEY CUTIEVERSE
   FICHA DETALLADA DE PERSONAJES
========================================== */

const API_DETALLE = "https://api.disneyapi.dev/character";

const estado = document.getElementById("detalle-estado");
const contenido = document.getElementById("detalle-contenido");

// Obtener el ID desde la URL
const parametros = new URLSearchParams(window.location.search);
const idPersonaje = parametros.get("id");


/* ==========================================
   MOSTRAR LISTAS DE INFORMACIÓN
========================================== */

function mostrarLista(idElemento, valores) {

    const lista = document.getElementById(idElemento);
    lista.replaceChildren();

    if (!Array.isArray(valores) || valores.length === 0) {

        const elemento = document.createElement("li");

        elemento.textContent = "Sin información disponible";

        lista.appendChild(elemento);
        return;
    }

    valores.forEach(valor => {

        const elemento = document.createElement("li");

        elemento.textContent = valor;

        lista.appendChild(elemento);
    });
}


/* ==========================================
   MOSTRAR DATOS DEL PERSONAJE
========================================== */

function mostrarDetalle(personaje) {

    // Nombre e identificador
    document.getElementById("detalle-nombre").textContent =
        personaje.name || "Personaje Disney";

    document.getElementById("detalle-id").textContent =
        `Personaje #${personaje._id}`;

    // Imagen principal
    const contenedorImagen =
        document.getElementById("detalle-imagen");

    contenedorImagen.replaceChildren();

    if (personaje.imageUrl) {

        const imagen = document.createElement("img");

        imagen.src = personaje.imageUrl;
        imagen.alt = personaje.name || "Personaje Disney";

        imagen.onerror = () => {
            contenedorImagen.textContent = "✨";
        };

        contenedorImagen.appendChild(imagen);

    } else {

        contenedorImagen.textContent = "✨";
    }

    // Películas
    mostrarLista(
        "detalle-peliculas",
        personaje.films
    );

    // Series de televisión
    mostrarLista(
        "detalle-series",
        personaje.tvShows
    );

    // Cortometrajes
    mostrarLista(
        "detalle-cortos",
        personaje.shortFilms
    );

    // Videojuegos
    mostrarLista(
        "detalle-videojuegos",
        personaje.videoGames
    );

    // Aliados
    mostrarLista(
        "detalle-aliados",
        personaje.allies
    );

    // Enemigos
    mostrarLista(
        "detalle-enemigos",
        personaje.enemies
    );

    // Atracciones Disney
    mostrarLista(
        "detalle-parques",
        personaje.parkAttractions
    );

    // Actualizar título de la pestaña
    document.title =
        `${personaje.name} | Disney Cutieverse`;

    // Mostrar la información
    estado.hidden = true;
    contenido.hidden = false;
}


/* ==========================================
   CONSULTAR PERSONAJE POR SU ID
========================================== */

async function cargarDetalle() {

    if (!idPersonaje || !/^\d+$/.test(idPersonaje)) {

        estado.textContent =
            "No se seleccionó un personaje válido. ♡";

        return;
    }

    const url = `${API_DETALLE}/${idPersonaje}`;

    estado.textContent =
        "Buscando información del personaje... ✨";

    try {

        // PETICIÓN HTTP GET
        const respuesta = await fetch(url);

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }

        // CONVERTIR RESPUESTA A JSON
        const datos = await respuesta.json();

        const personaje = datos.data;

        if (!personaje || Array.isArray(personaje)) {

            throw new Error(
                "No se encontraron datos del personaje"
            );
        }

        console.log("Personaje obtenido:", personaje);

        // Mostrar la información en nuestra página
        mostrarDetalle(personaje);

    } catch (error) {

        console.error("Error al cargar la ficha:", error);

        estado.textContent =
            "No pudimos cargar este personaje. " +
            "Intenta nuevamente. ♡";
    }
}


/* ==========================================
   INICIAR FICHA
========================================== */

cargarDetalle();
