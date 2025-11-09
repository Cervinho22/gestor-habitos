import { useState, useEffect } from 'react';

// Etiqueta única para guardar los datos en el navegador
const CLAVE_ALMACENAMIENTO = 'gestor-habitos-app';

// ----------------------------------------------------
// FUNCIONES AUXILIARES PARA LOCALSTORAGE
// ----------------------------------------------------

// Función para leer los hábitos guardados al inicio
const obtenerHabitosGuardados = () => {
  try {
    const datosGuardados = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    // Si hay datos, los convertimos de texto (JSON) a objetos JavaScript.
    // Si no hay, devolvemos un array vacío [].
    return datosGuardados ? JSON.parse(datosGuardados) : [];
  } catch (error) {
    console.error("Error al cargar hábitos:", error);
    return [];
  }
};

// ----------------------------------------------------
// EL GANCHO PRINCIPAL (HOOK)
// ----------------------------------------------------
export function useHabitos() {
  // 1. ESTADO: Inicializamos el estado llamando a la función que lee localStorage
  const [listaHabitos, setListaHabitos] = useState(obtenerHabitosGuardados);

  // 2. EFECTO: Guardamos los hábitos cada vez que 'listaHabitos' cambia
  useEffect(() => {
    try {
      // Convertimos el objeto JavaScript a texto (JSON) para guardarlo
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(listaHabitos));
    } catch (error) {
      console.error("Error al guardar hábitos:", error);
    }

  }, [listaHabitos]);

  // ----------------------------------------------------
  // FUNCIONES PARA MODIFICAR LA LISTA
  // ----------------------------------------------------
  
  const agregarHabito = (nombre, frecuencia) => {
    const nuevoHabito = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      frecuencia: frecuencia,
      completado: false,
    };
    // Creamos una nueva lista: copia de la anterior + el nuevo hábito
    setListaHabitos(prevHabitos => [...prevHabitos, nuevoHabito]);
  };
  
  const eliminarHabito = (idAEliminar) => {
    // Usamos filter para crear una nueva lista sin el hábito que tenga ese ID
    const nuevaLista = listaHabitos.filter(h => h.id !== idAEliminar);
    setListaHabitos(nuevaLista);
  };
  
  const cambiarEstadoCompletado = (idACambiar) => {
    // Usamos map para recorrer la lista y cambiar solo el hábito con el ID dado
    const nuevaLista = listaHabitos.map(h => {
      if (h.id === idACambiar) {
        return {
          ...h, // Copiamos el hábito original
          completado: !h.completado, // Cambiamos el estado opuesto
        };
      }
      return h; // Devolvemos los demás hábitos sin cambios
    });
    setListaHabitos(nuevaLista);
  };

  // ----------------------------------------------------
  // RETORNO DEL GANCHO
  // ----------------------------------------------------
  return {
    listaHabitos,
    agregarHabito,
    eliminarHabito,
    cambiarEstadoCompletado,
  };
}