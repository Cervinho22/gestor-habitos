import { useState, useEffect } from 'react';


const clave_almacenamiento = 'gestor-habitos-app';                        // Etiqueta única para guardar los datos en el navegador

// Función para leer los hábitos guardados al inicio
const obtenerHabitosGuardados = () => {
  try {
    const datosGuardados = localStorage.getItem(clave_almacenamiento);
    return datosGuardados ? JSON.parse(datosGuardados) : [];              // Si hay datos, los convertimos de JSON a objetos JavaScript.
  } catch (error) {
    console.error("Error al cargar hábitos:", error);
    return [];
  }
};



export function useHabitos() {
  
  const [listaHabitos, setListaHabitos] = useState(obtenerHabitosGuardados);  //Inicializamos leyendo lo que tenemos en el LocalStorage

  
  useEffect(() => {                                                           //Usamos useEffects para guardar los cambios 
    try {
      localStorage.setItem(clave_almacenamiento, JSON.stringify(listaHabitos));
    } catch (error) {
      console.error("Error al guardar hábitos:", error);
    }

  }, [listaHabitos]);                                                          //Dependemos de la lista de habitos                     



  //Funcion para agregar un habito
  const agregarHabito = (nombre, frecuencia) => {
    const nuevoHabito = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      frecuencia: frecuencia,
      completado: false,
    };
    setListaHabitos(prevHabitos => [...prevHabitos, nuevoHabito]);              //Creamos una nueva lista: copia de la anterior + el nuevo hábito
  };
  

  //Funcion para eliminar un habito
  const eliminarHabito = (idAEliminar) => {
    const nuevaLista = listaHabitos.filter(h => h.id !== idAEliminar);          //Usamos filter para crear una nueva lista sin el hábito que tenga ese ID
    setListaHabitos(nuevaLista);
  };
  

  //Funcion que cambia de estado el habito
  const cambiarEstadoCompletado = (idACambiar) => {
    const nuevaLista = listaHabitos.map(h => {                                  //Usamos map para recorrer la lista y cambiar solo el hábito con el ID dado
      if (h.id === idACambiar) {
        return {
          ...h,                                                                 //... lo usamos para copiar todo lo que tiene un habito
          completado: !h.completado, 
        };
      }
      return h; 
    });
    setListaHabitos(nuevaLista);
  };

  return {
    listaHabitos,
    agregarHabito,
    eliminarHabito,
    cambiarEstadoCompletado,
  };
}