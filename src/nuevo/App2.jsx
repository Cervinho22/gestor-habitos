// src/App.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'https://esm.sh/react@18.2.0';

// URL base de tu backend PHP. Asegúrate de que esta URL sea correcta.
// En un entorno local, esto debería apuntar a la carpeta donde está tu archivo api.php
// IMPORTANTE: Debes asegurarte de que tu servidor PHP esté corriendo y que esta URL sea accesible.
const API_URL = 'http://localhost:8000/backend/api.php'; 

// --- 1. Custom Hook para la Lógica de la API (useHabitosApi) ---

const useHabitosApi = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Efecto para inicializar el usuario si hay un token guardado
  useEffect(() => {
    if (token) {
      // En una aplicación real, se haría una llamada a /user para obtener los datos
      // Aquí, solo asumimos que el token es válido y actualizamos el estado.
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        setUser(storedUser);
      } else {
        // Token inválido o sin datos de usuario, lo limpiamos
        handleLogout();
      }
    }
  }, [token]);

  // Función genérica para manejar peticiones a la API de PHP
  const fetchApi = useCallback(async (endpoint, method = 'GET', data = null) => {
    setIsLoading(true);
    setError(null);

    const headers = {
      'Content-Type': 'application/json',
    };

    // Añadir el token de autorización si está disponible
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    };
    
    // --- LÓGICA DE REINTENTO CON RETARDO (Exponential Backoff, aunque simple) ---
    // Implementamos un mecanismo de reintento simple para manejar fallos de red/servidor
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${API_URL}/${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
          // Manejo de errores 401 (No autorizado) si el token es viejo/inválido
          if (response.status === 401 && endpoint !== 'login' && endpoint !== 'register') {
            handleLogout();
            throw new Error('Sesión expirada o no válida. Por favor, inicia sesión de nuevo.');
          }
          throw new Error(result.error || `Error en la petición: ${response.status}`);
        }

        // Éxito
        setIsLoading(false);
        return result.data;
        
      } catch (err) {
        lastError = err;
        
        // Si es el último intento o un error de autorización 401 (ya manejado arriba), salimos
        if (attempt === MAX_RETRIES - 1 || lastError.message.includes('Sesión expirada')) {
            break; 
        }

        // Esperar antes de reintentar (1s, 2s, 4s)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Si salimos del bucle por error
    setIsLoading(false);
    setError(lastError.message);
    console.error(lastError);
    throw lastError; // Re-lanza el error para que la función que lo llamó lo maneje

  }, [token]);


  // --- Funciones de Autenticación ---

  const handleAuth = async (endpoint, username, password) => {
    try {
      // Endpoint es 'login' o 'register'
      const data = await fetchApi(endpoint, 'POST', { username, password });
      
      // Guardar datos de sesión
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (e) {
      // El error ya fue manejado y establecido en el estado por fetchApi
      return false;
    }
  };

  const handleRegister = (username, password) => handleAuth('register', username, password);
  const handleLogin = (username, password) => handleAuth('login', username, password);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setHabits([]); // Limpiar hábitos al cerrar sesión
    // Limpiar errores si existían
    setError(null);
    setIsLoading(false);
  };

  // --- Funciones CRUD de Hábitos ---

  // Obtiene los hábitos del usuario actual
  const fetchHabits = async () => {
    if (!token) return;
    try {
      const data = await fetchApi('habits', 'GET');
      setHabits(data);
    } catch (e) {
      // Ya manejado
    }
  };

  // Crea un nuevo hábito
  const addHabit = async (name, description) => {
    try {
      const newHabit = await fetchApi('habits', 'POST', { name, description });
      setHabits(prev => [...prev, newHabit]);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Actualiza un hábito (nombre, descripción, o estado completed)
  const updateHabit = async (id, updates) => {
    try {
      const updatedHabit = await fetchApi('habits', 'PUT', { id, ...updates });
      
      setHabits(prev => prev.map(h => 
        h.id === id ? updatedHabit : h
      ));
      return true;
    } catch (e) {
      return false;
    }
  };

  // Elimina un hábito
  const deleteHabit = async (id) => {
    try {
      await fetchApi('habits', 'DELETE', { id }); 
      setHabits(prev => prev.filter(h => h.id !== id));
      return true;
    } catch (e) {
      return false;
    }
  };

  // Cargar hábitos al iniciar sesión o al cargar el componente si ya hay token
  useEffect(() => {
    if (token && user) {
      fetchHabits();
    }
  }, [token, user]); // Depende de token y user

  return {
    user,
    habits,
    isLoading,
    error,
    setError, // Permitir limpiar errores desde los componentes
    handleLogin,
    handleRegister,
    handleLogout,
    addHabit,
    updateHabit,
    deleteHabit,
  };
};

// --- 2. Componentes de la Aplicación ---

/**
 * Componente para el formulario de Login/Registro.
 */
const AuthForm = ({ isLogin, handleAuthSubmit, isLoading, apiError, clearError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const title = isLogin ? 'Iniciar Sesión' : 'Registrarse';
  const buttonText = isLogin ? 'Entrar' : 'Crear Cuenta';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiError) clearError(null);
    handleAuthSubmit(username, password);
  };

  return (
    <div className="card">
      <h2>{title}</h2>
      {apiError && <div className="message error">{apiError}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Usuario:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Cargando...' : buttonText}
        </button>
      </form>
    </div>
  );
};

/**
 * Componente para añadir nuevos hábitos.
 */
const AddHabitForm = ({ addHabit, isLoading }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
        setFormError("El nombre del hábito no puede estar vacío.");
        return;
    }

    const success = await addHabit(name, description);
    
    if (success) {
      setName('');
      setDescription('');
    } else {
        // El error ya se muestra a nivel global, pero podemos dar feedback aquí
        setFormError("Error al añadir el hábito. Intenta de nuevo.");
    }
  };

  return (
    <div className="card">
      <h3>Añadir Nuevo Hábito</h3>
      {formError && <div className="message error">{formError}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nombre:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Descripción (Opcional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows="2"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Hábito'}
        </button>
      </form>
    </div>
  );
};

/**
 * Componente para un solo ítem de la lista de hábitos.
 */
const HabitItem = ({ habit, updateHabit, deleteHabit, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description);
  
  // Iconos simples (usando unicode)
  const iconEdit = '✏️';
  const iconDelete = '🗑️';
  const iconComplete = '✅';
  const iconSave = '💾';
  const iconCancel = '❌';

  const handleToggleCompleted = () => {
    // El 'completed' en PHP es un booleano (true/false)
    updateHabit(habit.id, { completed: !habit.completed });
  };

  const handleSave = async () => {
    if (!name.trim()) return; // Evitar nombres vacíos
    const success = await updateHabit(habit.id, { name, description });
    if (success) {
      setIsEditing(false);
    }
    // Si falla, el error global se mostrará
  };

  const handleCancel = () => {
    setName(habit.name);
    setDescription(habit.description);
    setIsEditing(false);
  };
  
  // Usamos el estado del loading solo para deshabilitar los botones de acción
  const isActionDisabled = isLoading && !isEditing;

  return (
    <div className={`habit-item ${habit.completed ? 'completed' : ''}`}>
      <div className="habit-details">
        {isEditing ? (
          <div className="form-group">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              disabled={isLoading}
            />
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              disabled={isLoading}
              rows="1"
            />
          </div>
        ) : (
          <>
            <div className="habit-name">{habit.name}</div>
            <div className="habit-description">{habit.description}</div>
          </>
        )}
      </div>

      <div className="habit-actions">
        {isEditing ? (
          <>
            <button className="btn-icon" onClick={handleSave} disabled={isLoading} title="Guardar">
              <span className="icon">{iconSave}</span>
            </button>
            <button className="btn-icon" onClick={handleCancel} disabled={isLoading} title="Cancelar">
              <span className="icon">{iconCancel}</span>
            </button>
          </>
        ) : (
          <>
            <button 
              // Cambiamos la clase de éxito/peligro para reflejar el estado de la acción
              className={`btn-icon ${habit.completed ? 'btn-danger' : 'btn-success'}`}
              onClick={handleToggleCompleted} 
              disabled={isActionDisabled}
              title={habit.completed ? 'Marcar como Pendiente' : 'Marcar como Completado'}
            >
              {/* Usamos el ícono de completado o el de cancelar dependiendo del estado */}
              <span className="icon">{habit.completed ? iconCancel : iconComplete}</span>
            </button>

            <button className="btn-icon" onClick={() => setIsEditing(true)} disabled={isActionDisabled} title="Editar">
              <span className="icon">{iconEdit}</span>
            </button>
            
            <button className="btn-icon btn-danger" onClick={() => deleteHabit(habit.id)} disabled={isActionDisabled} title="Eliminar">
              <span className="icon">{iconDelete}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};


/**
 * Componente principal de la aplicación.
 */
export default function App() {
  const { 
    user, 
    habits, 
    isLoading, 
    error, 
    setError,
    handleLogin, 
    handleRegister, 
    handleLogout, 
    addHabit, 
    updateHabit, 
    deleteHabit 
  } = useHabitosApi();

  // Estado para alternar entre Login y Registro
  const [isLoginView, setIsLoginView] = useState(true);

  // Muestra el error de la API o el mensaje de carga
  const StatusMessage = useMemo(() => {
    if (error) {
        // Limpiamos el error después de 5 segundos para que no estorbe
        // Utilizamos setTimeout dentro de useEffect o usamos un ref, pero por simplicidad aquí va directo
        setTimeout(() => setError(null), 5000); 
        return <div className="message error">Error: {error}</div>;
    }
    if (isLoading) {
        return <div className="message loading">Cargando...</div>;
    }
    return null;
  }, [error, isLoading]); // No incluir setError en dependencias ya que es parte del hook

  // Si no hay usuario, mostrar las vistas de Autenticación
  if (!user) {
    return (
      <div className="app-container">
        <h1>Gestor de Hábitos - PHP & React</h1>
        {StatusMessage}
        
        <AuthForm 
          isLogin={isLoginView}
          handleAuthSubmit={isLoginView ? handleLogin : handleRegister}
          isLoading={isLoading}
          apiError={error}
          clearError={setError}
        />
        
        <div className="card" style={{ textAlign: 'center' }}>
          <button 
            className="btn-primary" 
            onClick={() => setIsLoginView(!isLoginView)}
            disabled={isLoading}
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            {isLoginView ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Iniciar Sesión'}
          </button>
        </div>
      </div>
    );
  }

  // --- Vista Principal (Gestión de Hábitos) ---
  return (
    <div className="app-container">
      <header className="app-header">
        <p>Bienvenido/a, <strong>{user.username}</strong></p>
        <button 
          onClick={handleLogout} 
          className="btn-primary btn-danger"
          disabled={isLoading}
        >
          Cerrar Sesión
        </button>
      </header>
      
      <h1>Mis Hábitos Diarios</h1>

      {StatusMessage}
      
      <AddHabitForm 
        addHabit={addHabit} 
        isLoading={isLoading} 
      />

      <div className="card">
        <h3>Lista de Hábitos ({habits.length})</h3>
        {habits.length === 0 && !isLoading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            Aún no tienes hábitos registrados. ¡Empieza añadiendo uno!
          </p>
        ) : (
          <div className="habit-list">
            {habits
              // Pone los completados al final, sin mutar el array original
              .sort((a, b) => a.completed - b.completed) 
              .map(habit => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  updateHabit={updateHabit}
                  deleteHabit={deleteHabit}
                  isLoading={isLoading}
                />
              ))}
          </div>
        )}
      </div>

    </div>
  );
}