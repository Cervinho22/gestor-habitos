import { useState, useEffect, useMemo, useCallback } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; 
const mapHabitToFrontend = (h) => ({
    id: h.id,
    nombre: h.name || h.nombre,
    frecuencia: h.frequency,
    completado: h.is_completed || false, 
    racha: h.current_streak || 0,
    ultimoCompletado: h.last_completed_at 
        ? new Date(h.last_completed_at).getTime() 
        : 0, 
});

const useAppLogic = () => {
    const initialToken = localStorage.getItem('authToken');
    const [token, setToken] = useState(initialToken);
    const [user, setUser] = useState(null);
    const [authError, setAuthError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({}); 
    const [loading, setLoading] = useState(false);
    const [listaHabitos, setListaHabitos] = useState([]);
    const apiFetch = useCallback(async (endpoint, method = 'GET', data = null, needsAuth = true) => {
    const currentToken = localStorage.getItem('authToken');

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (needsAuth && currentToken) {
        options.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (response.status === 204) { 
        return null;
    }

    if (!response.ok) {
        const errorText = await response.text();
        let errorData = { message: `Error en la API: ${response.status} - ${response.statusText}` };

        try {
            errorData = JSON.parse(errorText);
            
            if (response.status === 422 && errorData.errors) {
                throw errorData; 
            }

        } catch (e) {
            if (response.status === 401 && needsAuth) {
                setToken(null);
                setUser(null);
                localStorage.removeItem('authToken');
                setListaHabitos([]); 
            }
        }
        
        throw new Error(errorData.message || `Error en la API: ${response.status}`);
    }

    return response.json();
}, [token]);
  
const handleAuthResponse = (data) => {
    console.log('✅ Login exitoso, datos:', data);
    setToken(data.token);
    setUser(data.user); 
    localStorage.setItem('authToken', data.token);
    setAuthError(null);
    setValidationErrors({});
    setLoading(false);
};

    const login = useCallback(async (email, password) => {
        setLoading(true);
        setAuthError(null);
        setValidationErrors({});
        try {
            const data = await apiFetch('/login', 'POST', { email, password }, false);
            handleAuthResponse(data);
        } catch (error) {
            setAuthError(error.message);
            setLoading(false);
        }
    }, [apiFetch]);

    const register = useCallback(async (name, email, password, password_confirmation) => {
        setLoading(true);
        setAuthError(null);
        setValidationErrors({}); 
        try {
            const data = await apiFetch('/register', 'POST', { name, email, password, password_confirmation }, false);
            handleAuthResponse(data);
        } catch (error) {
            if (error.errors) {
                setValidationErrors(error.errors);
                setAuthError(error.message); 
            } else {
                setAuthError(error.message);
            }
            setLoading(false);
        }
    }, [apiFetch]);

    const logout = useCallback(async () => {
        try {
            if (token) {
                await apiFetch('/logout', 'POST', null, true).catch(() => {});
            }
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('authToken');
            setListaHabitos([]); 
            setValidationErrors({});
            setLoading(false);
        }
    }, [token, apiFetch]);
    const resetAuthError = useCallback(() => {
        setAuthError(null);
        setValidationErrors({}); 
    }, []);
   
    const cargarHabitos = useCallback(async () => {
        if (!token) return;
        try {
            const habitsDB = await apiFetch('/habits', 'GET', null, true); 
            const listaMapeada = habitsDB.habits.map(mapHabitToFrontend);
            setListaHabitos(listaMapeada);
        } catch (error) {
            console.error("Error al cargar hábitos:", error.message);
        }
    }, [apiFetch, token]);

    // Efecto para cargar hábitos al iniciar o cambiar el token
    useEffect(() => {
        if (token) {
            cargarHabitos();
        }
    }, [cargarHabitos, token]);
    
    const agregarHabito = async (nombre, frecuencia) => {
        if (!nombre.trim() || !token) return;
        try {
            const nuevoHabitoDB = await apiFetch('/habits', 'POST', { name: nombre.trim(), frequency: frecuencia }, true);
            const habitoParaFrontend = mapHabitToFrontend(nuevoHabitoDB);
            setListaHabitos(prevHabitos => [...prevHabitos, habitoParaFrontend]);
        } catch (error) {
            console.error("Error al añadir hábito:", error.message);
        }
    };
    
    const cambiarEstadoCompletado = async (habitId) => {
        if (!token) return;
        try {
            const habitActualizadoDB = await apiFetch(`/habits/${habitId}/toggle`, 'POST', null, true);
            const habitActualizadoFrontend = mapHabitToFrontend(habitActualizadoDB);
            setListaHabitos(prevHabitos => prevHabitos.map(h => 
                h.id === habitId ? habitActualizadoFrontend : h
            ));
        } catch (error) {
            console.error("Error al hacer toggle:", error.message);
        }
    };

    const editarHabito = async (idAEditar, nuevoNombre, nuevaFrecuencia) => {
        if (!nuevoNombre.trim() || !token) return;
        try {
            const habitActualizadoDB = await apiFetch(`/habits/${idAEditar}`, 'PUT', { name: nuevoNombre.trim(), frequency: nuevaFrecuencia }, true);
            const habitActualizadoFrontend = mapHabitToFrontend(habitActualizadoDB);
            setListaHabitos(prevHabitos => prevHabitos.map(h => 
                h.id === idAEditar ? habitActualizadoFrontend : h
            ));
        } catch (error) {
            console.error("Error al editar hábito:", error.message);
        }
    };

    const eliminarHabito = async (idAEliminar) => {
        if (!token) return;
        try {
            await apiFetch(`/habits/${idAEliminar}`, 'DELETE', null, true);
            setListaHabitos(prevHabitos => prevHabitos.filter(h => h.id !== idAEliminar));
        } catch (error) {
            console.error("Error al eliminar hábito:", error.message);
        }
    };

    // MÉTRICAS CALCULADAS
    const metricas = useMemo(() => {
        const totalHabitos = listaHabitos.length;
        const completadosHoy = listaHabitos.filter(h => h.completado).length; 
        
        const porcentajeCumplimiento = totalHabitos > 0 ? Math.round((completadosHoy / totalHabitos) * 100) : 0;
        return { totalHabitos, completadosHoy, porcentajeCumplimiento };
    }, [listaHabitos]);

    return {
        token, user, authError, validationErrors, loading, 
        login, register, logout,
        resetAuthError, 
        listaHabitos, agregarHabito, cambiarEstadoCompletado, editarHabito, eliminarHabito, metricas,
    };
};

function HabitoItem({ habito, eliminarHabito, cambiarEstadoCompletado, editarHabito }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editNombre, setEditNombre] = useState(habito.nombre);
    const [editFrecuencia, setEditFrecuencia] = useState(habito.frecuencia);

    const handleGuardar = () => {
        if (editNombre.trim() === '') return;
        editarHabito(habito.id, editNombre, editFrecuencia);
        setIsEditing(false);
    };

    const showRacha = habito.racha > 0;
    
    // Clases Tailwind
    const liClasses = `flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 mb-3 rounded-xl shadow-md transition duration-300 ${habito.completado ? 'bg-green-50 border-l-4 border-green-500' : 'bg-white border-l-4 border-gray-200 hover:shadow-lg'}`;
    const buttonBase = "py-2 px-3 text-sm font-medium rounded-lg transition duration-150";

    return (
        <li className={liClasses}>
            {isEditing ? (
                // --- MODO EDICIÓN ---
                <div className="flex flex-col sm:flex-row gap-2 w-full items-center">
                    <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        placeholder="Nuevo nombre"
                        className="flex-grow p-2 border rounded-lg w-full sm:w-auto"
                    />
                    <select
                        value={editFrecuencia}
                        onChange={(e) => setEditFrecuencia(e.target.value)}
                        className="p-2 border rounded-lg w-full sm:w-auto"
                    >
                        <option value="diaria">Diaria</option>
                        <option value="semanal">Semanal</option>
                    </select>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                        <button 
                            onClick={handleGuardar}
                            className={`${buttonBase} bg-green-500 text-white hover:bg-green-600`}
                        >
                            Guardar
                        </button>
                        <button 
                            onClick={() => setIsEditing(false)}
                            className={`${buttonBase} bg-gray-300 text-gray-700 hover:bg-gray-400`}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                // MODO VISUALIZACIÓN
                <>
                    <div className="flex flex-col sm:flex-row sm:items-center mb-2 sm:mb-0">
                        <span className={`text-lg font-semibold ${habito.completado ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                            {habito.nombre} 
                        </span>
                        <small className="ml-0 sm:ml-4 text-gray-500 text-sm">
                            ({habito.frecuencia})
                        </small>
                        {showRacha && (
                            <span className="ml-0 sm:ml-4 text-yellow-600 text-sm font-medium bg-yellow-100 px-2 py-0.5 rounded-full">
                                🔥 {habito.racha} día{habito.racha > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2 mt-2 sm:mt-0">
                        <button 
                            onClick={() => cambiarEstadoCompletado(habito.id)}
                            className={`${buttonBase} ${habito.completado ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                        >
                            {habito.completado ? 'Deshacer' : 'Completar'}
                        </button>
                        <button 
                            onClick={() => setIsEditing(true)}
                            className={`${buttonBase} bg-indigo-500 text-white hover:bg-indigo-600`}
                        >
                            Editar
                        </button>
                        <button 
                            onClick={() => eliminarHabito(habito.id)}
                            className={`${buttonBase} bg-red-500 text-white hover:bg-red-600`}
                        >
                            Eliminar
                        </button>
                    </div>
                </>
            )}
        </li>
    );
}

function HabitTrackerApp({ data }) {
    const { listaHabitos, agregarHabito, eliminarHabito, cambiarEstadoCompletado, editarHabito, metricas, logout, user } = data; 

    const [nombreHabito, setNombreHabito] = useState('');
    const [frecuenciaSeleccionada, setFrecuenciaSeleccionada] = useState('diaria'); 

    const manejarEnvio = (evento) => {
        evento.preventDefault(); 
        const nombreLimpio = nombreHabito.trim();
        if (nombreLimpio === '') return;
        
        agregarHabito(nombreLimpio, frecuenciaSeleccionada); 
        setNombreHabito(''); 
        setFrecuenciaSeleccionada('diaria'); 
    };
    
    const metricaCardClasses = "bg-white p-5 rounded-xl shadow-lg text-center transition duration-300 transform hover:scale-[1.02] border-t-4 border-blue-400";

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header y Logout */}
                <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-800">Gestor de Hábitos</h1>
                        <p className="text-sm text-gray-500 mt-1">¡Hola, {user?.name || 'Usuario'}!</p>
                    </div>
                    <button
                        onClick={logout}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold shadow-md transition duration-150"
                    >
                        Cerrar Sesión
                    </button>
                </header>

                {/* PANEL DE MÉTRICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className={metricaCardClasses}>
                        <h3 className="text-lg font-medium text-gray-600">Total Hábitos</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{metricas.totalHabitos}</p>
                    </div>
                    <div className={metricaCardClasses}>
                        <h3 className="text-lg font-medium text-gray-600">Completados Hoy</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{metricas.completadosHoy}</p>
                    </div>
                    <div className={`${metricaCardClasses} border-t-4 ${metricas.porcentajeCumplimiento >= 80 ? 'border-green-500' : 'border-orange-400'}`}>
                        <h3 className="text-lg font-medium text-gray-600">Cumplimiento</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{metricas.porcentajeCumplimiento}%</p>
                    </div>
                </div>

                {/* Formulario de Añadir */}
                <form onSubmit={manejarEnvio} className="flex flex-col sm:flex-row gap-3 p-6 bg-white rounded-xl shadow-lg mb-8">
                    <input
                        type="text"
                        placeholder="Ej: Leer 10 págs o 30 min de ejercicio"
                        value={nombreHabito}
                        onChange={(e) => setNombreHabito(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <select
                        value={frecuenciaSeleccionada}
                        onChange={(e) => setFrecuenciaSeleccionada(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg w-full sm:w-1/4"
                    >
                        <option value="diaria">Diaria</option>
                        <option value="semanal">Semanal</option>
                    </select>
                    
                    <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 w-full sm:w-auto"
                    >
                        Añadir Hábito
                    </button>
                </form>

                {/* Lista de Hábitos */}
                <div className="lista-habitos">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">Mis Hábitos ({listaHabitos.length})</h2>
                    {listaHabitos.length === 0 
                        ? (<p className="text-gray-500 p-6 bg-white rounded-xl shadow-md">Aún no tienes hábitos registrados. ¡Empieza a construir uno!</p>) 
                        : (
                            <ul className="space-y-4">
                                {listaHabitos.map(habito => (
                                    <HabitoItem 
                                        key={habito.id}
                                        habito={habito}
                                        eliminarHabito={eliminarHabito}
                                        cambiarEstadoCompletado={cambiarEstadoCompletado}
                                        editarHabito={editarHabito}
                                    />
                                ))}
                            </ul>
                        )
                    }
                </div>
            </div>
        </div>
    );
}

function AuthScreen({ login, register, loading, authError, validationErrors, resetAuthError }) { 
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const inputClasses = "w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150";
    const buttonClasses = "w-full py-3 rounded-lg text-white font-bold transition duration-150";

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;
        
        if (isLogin) {
            login(email, password);
        } else {
            register(name, email, password, passwordConfirm); 
        }
    };
    const getErrorClass = (field) => {
        return validationErrors[field] ? 'border-red-500' : 'border-gray-300';
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 w-full">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
                <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
                    {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </h2>

                {(authError && !validationErrors.email) && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{authError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 w-full">
                    {/* ENVOLTURA CON W-FULL PARA FORZAR APILAMIENTO Y ESPACIO */}
                    {!isLogin && (
                        <div className="w-full">
                            <input
                                type="text"
                                placeholder="Nombre Completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                                className={`${inputClasses} ${getErrorClass('name')}`}
                            />
                            {validationErrors.name && <p className="text-red-500 text-sm mt-1">{validationErrors.name[0]}</p>}
                        </div>
                    )}
                    <div className="w-full">
                        <input
                            type="email"
                            placeholder="Correo Electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={`${inputClasses} ${getErrorClass('email')}`}
                        />
                        {validationErrors.email && <p className="text-red-500 text-sm mt-1">{validationErrors.email[0]}</p>}
                    </div>
                    <div className="w-full">
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={`${inputClasses} ${getErrorClass('password')}`}
                        />
                        {!isLogin && validationErrors.password && <p className="text-red-500 text-sm mt-1">{validationErrors.password[0]}</p>}
                    </div>
                    {!isLogin && (
                        <div className="w-full">
                            <input
                                type="password"
                                placeholder="Confirmar Contraseña"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required={!isLogin}
                                className={`${inputClasses} ${getErrorClass('password')}`}
                            />
                        </div>
                    )}
                    {(isLogin || !validationErrors.password) && validationErrors.passwordConfirm && <p className="text-red-500 text-sm mt-1">{validationErrors.passwordConfirm[0]}</p>}


                    <div className="w-full pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`${buttonClasses} ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear Cuenta'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            resetAuthError(); 
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 transition duration-150"
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function App() { 
    const appData = useAppLogic();
    const { token, loading } = appData;

    if (loading) {
        return (
            <div className="font-sans antialiased min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
        );
    }
    return (
        <div className="font-sans antialiased">
            {token 
                ? <HabitTrackerApp data={appData} /> 
                : <AuthScreen 
                    login={appData.login} 
                    register={appData.register} 
                    loading={appData.loading} 
                    authError={appData.authError}
                    validationErrors={appData.validationErrors} 
                    resetAuthError={appData.resetAuthError} 
                  /> 
            }
        </div>
    );
}