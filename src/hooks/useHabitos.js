/*import { useState, useEffect, useMemo, useCallback } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; 
const userToken = 'rhSY0w5tqYY7nZ9cL9cndWM8NVd26M7hMmgUtEYr'; 
const getTodayTimestamp = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    return now.getTime();
};

const apiFetch = async (endpoint, method = 'GET', data = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`, 
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (response.status === 204) { 
        return null;
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `Error en la API: ${response.status}`);
    }

    return response.json();
};

export const useHabitos = () => {
    const [listaHabitos, setListaHabitos] = useState([]);
    const mapHabitToFrontend = (h) => ({
        id: h.id,
        nombre: h.name || h.nombre,
        frecuencia: h.frequency,
        completado: h.completado || false, 
        racha: h.current_streak || h.racha || 0,
        ultimoCompletado: h.last_completed_at 
            ? new Date(h.last_completed_at).getTime() 
            : 0, 
    });
    const cargarHabitos = useCallback(async () => {
        try {
            const habitsDB = await apiFetch('/habits', 'GET'); 
            const listaMapeada = habitsDB.habits.map(mapHabitToFrontend);
            setListaHabitos(listaMapeada);
        } catch (error) {
            console.error("Error al cargar hábitos:", error.message);
        }
    }, []);

    useEffect(() => {
        cargarHabitos();
    }, [cargarHabitos]);

    const agregarHabito = async (nombre, frecuencia) => {
        if (!nombre.trim()) return;
        try {
            const nuevoHabitoDB = await apiFetch('/habits', 'POST', {
                name: nombre.trim(), 
                frequency: frecuencia,
            });
            
            const habitoParaFrontend = mapHabitToFrontend(nuevoHabitoDB);
            setListaHabitos(prevHabitos => [...prevHabitos, habitoParaFrontend]);
        } catch (error) {
            console.error("Error al añadir hábito:", error.message);
        }
    };

    const cambiarEstadoCompletado = async (habitId) => {
        try {
            const habitActualizadoDB = await apiFetch(`/habits/${habitId}/toggle`, 'POST');
            const habitActualizadoFrontend = mapHabitToFrontend(habitActualizadoDB);
            setListaHabitos(prevHabitos => prevHabitos.map(h => 
                h.id === habitId ? habitActualizadoFrontend : h
            ));

        } catch (error) {
            console.error("Error al hacer toggle:", error.message);
        }
    };

    const editarHabito = async (idAEditar, nuevoNombre, nuevaFrecuencia) => {
        if (!nuevoNombre.trim()) return;
        try {
            const habitActualizadoDB = await apiFetch(`/habits/${idAEditar}`, 'PUT', {
                name: nuevoNombre.trim(), 
                frequency: nuevaFrecuencia,
            });

            const habitActualizadoFrontend = mapHabitToFrontend(habitActualizadoDB);

            setListaHabitos(prevHabitos => prevHabitos.map(h => 
                h.id === idAEditar ? habitActualizadoFrontend : h
            ));
        } catch (error) {
            console.error("Error al editar hábito:", error.message);
        }
    };
    const eliminarHabito = async (idAEliminar) => {
        try {
            await apiFetch(`/habits/${idAEliminar}`, 'DELETE');
            setListaHabitos(prevHabitos => prevHabitos.filter(h => h.id !== idAEliminar));
        } catch (error) {
            console.error("Error al eliminar hábito:", error.message);
        }
    };

    const metricas = useMemo(() => {
        const hoyTimestamp = getTodayTimestamp();
        const totalHabitos = listaHabitos.length;
        const completadosHoy = listaHabitos.filter(h => h.completado === true).length;
        const porcentajeCumplimiento = totalHabitos > 0 
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
        cambiarEstadoCompletado,
        editarHabito,
        eliminarHabito,
        metricas,
    };
};
*/