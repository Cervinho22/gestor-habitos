import { useState, useEffect, useMemo } from 'react';

// Etiqueta única para guardar los datos en el navegador
const clave_almacenamiento = 'gestor-habitos-app';

// Devuelve la fecha de hoy a medianoche 
const getTodayTimestamp = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reinicia la hora a medianoche (00:00:00)
    return now.getTime();
};

// Devuelve el timestamp del inicio del día de AYER
const getYesterdayTimestamp = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday.getTime();
};


// Función para leer los hábitos guardados en el inicio
const obtenerHabitosGuardados = () => {
    try {
        const datosGuardados = localStorage.getItem(clave_almacenamiento);
        const listaGuardada = datosGuardados ? JSON.parse(datosGuardados) : [];
        const hoyTimestamp = getTodayTimestamp();           //logica de reinicio de diario/semanal

        return listaGuardada.map(habito => {
            const rachaActual = habito.racha || 0; 
            const ultimoCompletado = habito.ultimoCompletado || 0;
        
            if (!habito.completado) {           // Si el hábito ya no está marcado, solo comprobamos si se rompió la racha ayer
                const ayerTimestamp = getYesterdayTimestamp();
                if (ultimoCompletado < ayerTimestamp && ultimoCompletado !== 0) {             // Si la última vez que lo hicimos fue ANTES de ayer, rompemos la racha
                    return { ...habito, racha: 0, ultimoCompletado: ultimoCompletado }; 
                }
                return { ...habito, racha: rachaActual, ultimoCompletado: ultimoCompletado };
            }


            if (habito.frecuencia === 'diaria') {
                if (ultimoCompletado < hoyTimestamp) {
                    const ayerTimestamp = getYesterdayTimestamp();
                    const rachaRota = ultimoCompletado < ayerTimestamp;                  // Si la última vez NO fue AYER, la racha se rompe a 0.
                
                    return {
                        ...habito,
                        completado: false, 
                        racha: rachaRota ? 0 : rachaActual, // Mantiene si fue ayer, rompe si fue antes
                        ultimoCompletado: ultimoCompletado // Mantiene el registro de cuándo fue la última vez
                    };
                }
            }
            return { ...habito, racha: rachaActual, ultimoCompletado: ultimoCompletado };
        });
    
    }catch (error) {
        console.error("Error al cargar hábitos:", error);
        return [];
    }
};

export function useHabitos() {
    const [listaHabitos, setListaHabitos] = useState(obtenerHabitosGuardados); // Inicializamos el estado de localStorage

    useEffect(() => {  // Guardamos los hábitos cada vez que 'listaHabitos' cambia
        try {
            localStorage.setItem(clave_almacenamiento, JSON.stringify(listaHabitos));
        }catch (error) {
            console.error("Error al guardar hábitos:", error);
        }
    }, [listaHabitos]);


    // Función para añadir un hábito
    const agregarHabito = (nombre, frecuencia) => {
        const nuevoHabito = {
            id: crypto.randomUUID(),
            nombre: nombre.trim(),    // Trim sirve para quitar los espacios innecesarios
            frecuencia: frecuencia,
            completado: false,
            ultimoCompletado: 0, 
            racha: 0,            
        };
        setListaHabitos(prevHabitos => [...prevHabitos, nuevoHabito]);
    };
 

    // Función para eliminar un hábito
    const eliminarHabito = (idAEliminar) => {
        const nuevaLista = listaHabitos.filter(h => h.id !== idAEliminar);
        setListaHabitos(nuevaLista);
    };


    // F. para cambiar de estado el hábito 
    const cambiarEstadoCompletado = (idACambiar) => {
        const hoyTimestamp = getTodayTimestamp();
        const ayerTimestamp = getYesterdayTimestamp();

        const nuevaLista = listaHabitos.map(h => {
            if (h.id === idACambiar) {
                if (h.completado) {
                    let rachaRevertida = h.racha;
                    let nuevaFechaCompletado = h.ultimoCompletado; // Asume que la última fecha permanece

                    if (h.ultimoCompletado === hoyTimestamp) {                      // Si se estaba desmarcando una acción HECHA HOY
                        rachaRevertida = Math.max(0, h.racha - 1);
                        if (rachaRevertida > 0) {
                            nuevaFechaCompletado = ayerTimestamp;
                        } else {
                            nuevaFechaCompletado = 0;
                        }
                    }
                
                    return {
                        ...h,
                        completado: false,
                        racha: rachaRevertida, 
                        ultimoCompletado: nuevaFechaCompletado 
                    };
                } 
                       
                let nuevaRacha = h.racha || 0;
                const ultimo = h.ultimoCompletado || 0;

                // Lógica de cálculo de racha
                if (ultimo === ayerTimestamp) {
                    nuevaRacha += 1;
                } else if (ultimo < ayerTimestamp && ultimo !== 0) {
                    nuevaRacha = 1; 
                } else if (ultimo === 0) {
                    nuevaRacha = 1;
                }
                return {
                    ...h, 
                    completado: true,
                    ultimoCompletado: hoyTimestamp, 
                    racha: nuevaRacha,              
                };
            }
            return h;
        });
        setListaHabitos(nuevaLista);
    };


    // F. para editar un hábito
    const editarHabito = (idAEditar, nuevoNombre, nuevaFrecuencia) => {
        const nuevaLista = listaHabitos.map(h => {
            if (h.id === idAEditar) {
                return {
                    ...h, 
                    nombre: nuevoNombre.trim(),
                    frecuencia: nuevaFrecuencia,
                };
            }
            return h;
        });
        setListaHabitos(nuevaLista);
    };



    const metricas = useMemo(() => {            //useMemo nos ayuda con el porcentaje
        const hoyTimestamp = getTodayTimestamp();
        const totalHabitos = listaHabitos.length; // Miramos la longitud de los hábitos
        const completadosHoy = listaHabitos.filter(h => h.ultimoCompletado === hoyTimestamp).length;  
        const porcentajeCumplimiento = totalHabitos > 0 // Calculamos el porcentaje
        ? Math.round((completadosHoy / totalHabitos) * 100) 
        : 0;

        return {
            totalHabitos,
            completadosHoy,
            porcentajeCumplimiento,
        };
    }, [listaHabitos]); 

    return {
        listaHabitos,
        agregarHabito,
        eliminarHabito,
        cambiarEstadoCompletado,
        editarHabito,
        metricas, 
    };
}