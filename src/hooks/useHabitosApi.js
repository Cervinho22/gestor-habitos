import { useState, useEffect, useCallback, useMemo } from 'react';

// URL base de tu API PHP
// ¡CORRECCIÓN CLAVE! Cambiamos de :8000 al puerto estándar 80 (omitiendo el puerto),
// que es la configuración más común en XAMPP/WAMP/MAMP.
const API_URL = 'http://localhost:8000/backend/api.php/';
const TOKEN_KEY = 'habit_tracker_token'; 

// Función auxiliar para hacer peticiones autenticadas
const fetchApi = async (route, method = 'GET', data = null) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : null,
    };

    const fullUrl = `${API_URL}${route}`;

    try {
        const response = await fetch(fullUrl, config);
        
        // 1. Intentamos leer el resultado JSON, incluso si la respuesta no es OK
        let result = {};
        let resultText = ''; // Para diagnóstico
        try {
            // Clona la respuesta para poder leer el texto si el JSON falla
            const clone = response.clone();
            resultText = await clone.text();
            
            // Solo parsear si hay contenido para evitar error de sintaxis en JSON vacío
            if (resultText) {
                 result = JSON.parse(resultText); 
            }
        } catch (e) {
            // Si el parsing JSON falla, lanzamos un error con el texto completo
            console.error("Error al parsear JSON:", resultText);
            throw new Error(`Respuesta no JSON de la API. Código: ${response.status}. Contenido: ${resultText.substring(0, 100)}...`);
        }


        // 2. Si la respuesta HTTP no es exitosa (4xx o 5xx), lanzamos el error
        if (!response.ok) {
            // Usamos el mensaje de error que viene de la API o un mensaje genérico
            const errorMessage = result.message || `Error en la solicitud a la API (${response.status} ${response.statusText})`;
            throw new Error(errorMessage);
        }

        // 3. Devolvemos el resultado
        return result;

    } catch (err) {
        // Manejamos específicamente el error de conexión (TypeError)
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            console.error(`ERROR DE CONEXIÓN: No se pudo conectar a ${fullUrl}`);
            const connectionError = new Error(
                `[ERROR DE CONEXIÓN] Asegúrate de que tu servidor PHP (XAMPP/WAMP/etc.) esté iniciado y que la URL "${fullUrl}" sea correcta. El puerto 8000 fue modificado a 80.`
            );
            connectionError.originalError = err;
            throw connectionError;
        }

        // Relanzamos cualquier otro error (errores de API, etc.)
        throw err;
    }
};

// ... (Resto del código del hook se mantiene igual)

export const useHabitosApi = () => {
    // ---------------------------------------------------------------------
    // --- ESTADO Y EFECTOS DE AUTENTICACIÓN -------------------------------
    // ---------------------------------------------------------------------
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState(null); // { id: number, email: string }
    const [apiError, setApiError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // ---------------------------------------------------------------------
    // --- ESTADO DE DATOS (HÁBITOS) ---------------------------------------
    // ---------------------------------------------------------------------
    const [listaHabitos, setListaHabitos] = useState([]);

    /**
     * Función para iniciar sesión y guardar el token.
     * @param {string} email 
     * @param {string} password 
     */
    const login = useCallback(async (email, password) => {
        setApiError(null);
        try {
            const result = await fetchApi('login', 'POST', { email, password });
            if (result.success && result.token) {
                localStorage.setItem(TOKEN_KEY, result.token);
                setIsAuthenticated(true);
                setUser(result.user);
                await cargarHabitos(); // Cargar hábitos tras el login
                return true;
            } else {
                // Esto maneja si success es false pero la respuesta.ok fue true
                throw new Error(result.message || 'Credenciales incorrectas.');
            }
        } catch (err) {
            setApiError(err.message);
            return false;
        }
    }, []);

    /**
     * Función para registrar un nuevo usuario e iniciar sesión.
     * @param {string} email 
     * @param {string} password 
     * @param {string} name
     */
    const register = useCallback(async (email, password,name) => {
        setApiError(null);
        try {
            const result = await fetchApi('register', 'POST', { email, password, name });
            if (result.success && result.token) {
                localStorage.setItem(TOKEN_KEY, result.token);
                setIsAuthenticated(true);
                setUser(result.user);
                await cargarHabitos(); // Cargar hábitos tras el registro
                return true;
            } else {
                throw new Error(result.message || 'Error en el registro.');
            }
        } catch (err) {
            setApiError(err.message);
            return false;
        }
    }, []);

    /**
     * Carga la información del usuario actual (si está autenticado).
     */
    const fetchUser = useCallback(async () => {
        setApiError(null);
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) {
                const result = await fetchApi('user', 'GET');
                if (result.success) {
                    setUser(result.user);
                    setIsAuthenticated(true);
                } else {
                    // Token inválido o expirado, forzamos el logout local
                    console.warn('Token inválido o expirado. Forzando logout local.');
                    logoutLocal();
                }
            } else {
                logoutLocal();
            }
        } catch (err) {
            setApiError(err.message);
            // Error de red, etc., asumimos que no estamos autenticados si falla al cargar
            logoutLocal();
        } finally {
            // Retraso para evitar el "parpadeo" en la carga inicial
            // setTimeout(() => setIsLoading(false), 500); 
        }
    }, []);

    /**
     * Función de logout solo local (limpia el token del storage).
     */
    const logoutLocal = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
        setUser(null);
        setListaHabitos([]);
        // No reseteamos isLoading aquí, se resetea en el useEffect o fetchUser
    }, []);

    /**
     * Función para cerrar la sesión en el servidor y localmente.
     */
    const logout = useCallback(async () => {
        setApiError(null);
        try {
            // Intentamos notificar al servidor para invalidar el token
            await fetchApi('logout', 'POST');
        } catch (err) {
            // Si falla el servidor, simplemente hacemos el logout local
            console.warn('Fallo al notificar al servidor para el logout, realizando logout local.', err.message);
        }
        logoutLocal();
    }, [logoutLocal]);


    // Efecto de inicialización: Verifica el token y carga el usuario
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) {
                await fetchUser();
            } else {
                logoutLocal();
            }
            setIsLoading(false);
        };
        init();
        // NOTA: No incluir 'fetchUser' y 'logoutLocal' en dependencias
        // ya que son callbacks estables o solo se deben ejecutar una vez al inicio.
    }, []);

    // ---------------------------------------------------------------------
    // --- LÓGICA DE HÁBITOS -----------------------------------------------
    // ---------------------------------------------------------------------

    /**
     * Carga todos los hábitos del usuario actual.
     */
    const cargarHabitos = useCallback(async () => {
        if (!isAuthenticated) return;

        setApiError(null);
        setIsLoading(true);
        try {
            const result = await fetchApi('habits', 'GET');
            if (result.success) {
                // Nos aseguramos de que todos los datos numéricos estén en formato correcto si es necesario, 
                // aunque la API PHP debería enviarlos ya como números para JSON.
                setListaHabitos(result.habits.map(h => ({
                    ...h,
                    id: parseInt(h.id),
                    currentStreak: parseInt(h.currentStreak),
                    longestStreak: parseInt(h.longestStreak),
                    completedToday: !!h.completedToday // Convertir a booleano
                })));
            } else {
                throw new Error(result.message || 'Error al cargar los hábitos.');
            }
        } catch (err) {
            setApiError(err.message);
            setListaHabitos([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // Efecto para cargar hábitos si la autenticación es exitosa
    useEffect(() => {
        if (isAuthenticated) {
            cargarHabitos();
        }
    }, [isAuthenticated, cargarHabitos]);


    /**
     * Agrega o edita un hábito.
     * @param {object} habito - El objeto hábito, con ID si es edición.
     */
    const guardarHabito = useCallback(async (habito) => {
        setApiError(null);
        try {
            const method = habito.id ? 'PUT' : 'POST';
            const route = habito.id ? `habits/${habito.id}` : 'habits';

            // Aseguramos que los valores sean correctos (solo 'name', 'icon', 'color')
            const data = {
                name: habito.name,
                icon: habito.icon,
                color: habito.color,
            };

            await fetchApi(route, method, data);
            await cargarHabitos(); // Recargar la lista
            return true;
        } catch (err) {
            setApiError(err.message);
            return false;
        }
    }, [cargarHabitos]);


    /**
     * Elimina un hábito.
     * @param {number} habitoId - ID del hábito a eliminar.
     */
    const eliminarHabito = useCallback(async (habitoId) => {
        setApiError(null);
        try {
            await fetchApi(`habits/${habitoId}`, 'DELETE');
            await cargarHabitos(); // Recargar la lista
        } catch (err) {
            setApiError(err.message);
        }
    }, [cargarHabitos]);


    /**
     * Cambia el estado de completado de un hábito.
     * @param {number} habitoId - ID del hábito.
     * @param {boolean} isCompleted - Nuevo estado.
     */
    const cambiarEstadoCompletado = useCallback(async (habitoId, isCompleted) => {
        setApiError(null);
        try {
            await fetchApi('complete', 'POST', { 
                habitId: habitoId, 
                isCompleted: !isCompleted // El front pasa el estado actual, el back lo gestiona
            });
            await cargarHabitos(); // Recargar para ver el estado y racha actualizados
        } catch (err) {
            setApiError(err.message);
        }
    }, [cargarHabitos]);
    

    const metricas = useMemo(() => {
        const totalHabitos = listaHabitos.length;
        // La propiedad 'completedToday' ya viene de la API, es más eficiente usarla.
        const completadosHoy = listaHabitos.filter(h => h.completedToday).length; 
        
        const porcentajeCumplimiento = totalHabitos > 0 
        ? Math.round((completadosHoy / totalHabitos) * 100) 
        : 0;

        // Calcular la racha promedio
        const totalStreaks = listaHabitos.reduce((sum, h) => sum + h.currentStreak, 0);
        const promedioRacha = totalHabitos > 0 ? (totalStreaks / totalHabitos).toFixed(1) : 0;


        return {
            totalHabitos,
            completadosHoy,
            porcentajeCumplimiento,
            promedioRacha,
            isLoading,
        };
    }, [listaHabitos, isLoading]); 

    return {
        isAuthenticated,
        user,
        listaHabitos,
        agregarHabito: guardarHabito, 
        editarHabito: guardarHabito,
        eliminarHabito,
        cambiarEstadoCompletado,
        login,
        register,
        logout,
        apiError,
        metricas,
        isLoading, // Retornamos isLoading para la interfaz de carga
    };
};