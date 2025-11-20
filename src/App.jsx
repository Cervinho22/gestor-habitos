import { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; 

const mapHabitToFrontend = (h) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastCompleted = h.last_completed_at 
        ? new Date(h.last_completed_at).setHours(0, 0, 0, 0)
        : null;
    
    const completado = lastCompleted === today.getTime();

    return {
        id: h.id,
        nombre: h.name || h.nombre,
        frecuencia: h.frequency,
        completado: completado, 
        racha: h.current_streak || h.racha || 0,
        ultimoCompletado: h.last_completed_at 
            ? new Date(h.last_completed_at).getTime() 
            : 0,
    };
};

const useAppLogic = () => {
    const initialToken = localStorage.getItem('authToken');
    const initialUser = localStorage.getItem('user');
    
    const [token, setToken] = useState(initialToken);
    const [user, setUser] = useState(initialUser ? JSON.parse(initialUser) : null);
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
        setToken(data.token);
        setUser(data.user); 
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
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
            localStorage.removeItem('user');
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
    
    return (
        <div className={`habit-item ${habito.completado ? 'completed' : ''}`}>
            {isEditing ? (
                <div className="edit-form">
                    <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        placeholder="Nuevo nombre"
                        className="edit-input"
                    />
                    <select
                        value={editFrecuencia}
                        onChange={(e) => setEditFrecuencia(e.target.value)}
                        className="edit-select"
                    >
                        <option value="diaria">Diaria</option>
                        <option value="semanal">Semanal</option>
                    </select>
                    <button onClick={handleGuardar} className="btn-save">
                        Guardar
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-cancel">
                        Cancelar
                    </button>
                </div>
            ) : (
                <>
                    <div className="habit-info">
                        <span className="habit-name">
                            {habito.nombre} 
                        </span>
                        <small className="habit-frequency">
                            ({habito.frecuencia})
                        </small>
                        {showRacha && (
                            <span className="habit-streak">
                                🔥 {habito.racha} día{habito.racha > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="habit-actions">
                        <button 
                            onClick={() => cambiarEstadoCompletado(habito.id)}
                            className={`action-btn ${habito.completado ? 'btn-undo' : 'btn-complete'}`}
                        >
                            {habito.completado ? 'Reactivar' : 'Completar'}
                        </button>
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="action-btn btn-edit"
                        >
                            Editar
                        </button>
                        <button 
                            onClick={() => eliminarHabito(habito.id)}
                            className="action-btn btn-delete"
                        >
                            Eliminar
                        </button>
                    </div>
                </>
            )}
        </div>
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

    return (
        <div className="habit-app">
            <div className="app-container">
                <header className="app-header">
                    <div>
                        <h1 className="app-title">Gestor de Hábitos</h1>
                        <p className="user-greeting">
                            <span className="user-dot"></span>
                            ¡Hola, <span className="user-name">{user?.name || 'Usuario'}!</span>
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="action-btn btn-delete"
                    >
                        Cerrar Sesión
                    </button>
                </header>

                <div className="metrics-grid">
                    <div className="metric-card" style={{borderLeftColor: '#3b82f6'}}>
                        <h3 className="metric-title">Total Hábitos</h3>
                        <p className="metric-value">{metricas.totalHabitos}</p>
                    </div>
                    <div className="metric-card" style={{borderLeftColor: '#10b981'}}>
                        <h3 className="metric-title">Completados Hoy</h3>
                        <p className="metric-value">{metricas.completadosHoy}</p>
                    </div>
                    <div className="metric-card" style={{borderLeftColor: metricas.porcentajeCumplimiento >= 80 ? '#10b981' : '#f59e0b'}}>
                        <h3 className="metric-title">Cumplimiento</h3>
                        <p className="metric-value">{metricas.porcentajeCumplimiento}%</p>
                    </div>
                </div>

                <form onSubmit={manejarEnvio} className="habit-form">
                    <input
                        type="text"
                        placeholder="Ej: Leer 10 págs o 30 min de ejercicio"
                        value={nombreHabito}
                        onChange={(e) => setNombreHabito(e.target.value)}
                        className="habit-input"
                    />
                    
                    <select
                        value={frecuenciaSeleccionada}
                        onChange={(e) => setFrecuenciaSeleccionada(e.target.value)}
                        className="habit-select"
                    >
                        <option value="diaria">Diaria</option>
                        <option value="semanal">Semanal</option>
                    </select>
                    
                    <button type="submit" className="habit-submit">
                        Añadir Hábito
                    </button>
                </form>

                <div className="habits-list">
                    <h2 className="habits-title">Mis Hábitos ({listaHabitos.length})</h2>
                    {listaHabitos.length === 0 
                        ? (<div className="empty-state">Aún no tienes hábitos registrados. ¡Empieza a construir uno!</div>) 
                        : (
                            <div>
                                {listaHabitos.map(habito => (
                                    <HabitoItem 
                                        key={habito.id}
                                        habito={habito}
                                        eliminarHabito={eliminarHabito}
                                        cambiarEstadoCompletado={cambiarEstadoCompletado}
                                        editarHabito={editarHabito}
                                    />
                                ))}
                            </div>
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
        return validationErrors[field] ? 'error' : '';
    };

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <div className="auth-logo">
                    <span>✓</span>
                </div>
                <h2 className="auth-title">
                    {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
                </h2>
                <p className="auth-subtitle">
                    {isLogin ? 'Inicia sesión en tu cuenta' : 'Regístrate para comenzar'}
                </p>

                {authError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6" role="alert">
                        <span className="block text-sm">{authError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <input
                                type="text"
                                placeholder="Nombre Completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                                className={`form-input ${getErrorClass('name')}`}
                            />
                            {validationErrors.name && <p className="text-red-500 text-sm mt-2 ml-1">{validationErrors.name[0]}</p>}
                        </div>
                    )}
                    <div>
                        <input
                            type="email"
                            placeholder="Correo Electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={`form-input ${getErrorClass('email')}`}
                        />
                        {validationErrors.email && <p className="text-red-500 text-sm mt-2 ml-1">{validationErrors.email[0]}</p>}
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={`form-input ${getErrorClass('password')}`}
                        />
                        {!isLogin && validationErrors.password && <p className="text-red-500 text-sm mt-2 ml-1">{validationErrors.password[0]}</p>}
                    </div>
                    {!isLogin && (
                        <div>
                            <input
                                type="password"
                                placeholder="Confirmar Contraseña"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required={!isLogin}
                                className={`form-input ${getErrorClass('password')}`}
                            />
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            resetAuthError(); 
                        }}
                        className="text-blue-600 hover:text-blue-800 transition duration-150 font-medium"
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
            <div className="auth-screen">
                <div className="auth-card">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Cargando...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
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