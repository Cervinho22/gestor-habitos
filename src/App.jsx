import React, { useState, useEffect, useCallback, useMemo } from 'react';
// RUTA CORREGIDA: Asumimos que useHabitosApi.js está en la carpeta correcta
import { useHabitosApi } from './hooks/useHabitosApi'; 

// ---------------------------------------------------------------------
// --- Componentes Reutilizables (Icon, Card, Modal) -------------------
// ---------------------------------------------------------------------

// Componente para iconos (simulando Lucide React)
const Icon = ({ name, className = '', color = 'currentColor' }) => {
    // Implementación simplificada de iconos SVG para evitar dependencias
    const getSvg = (iconName) => {
        switch (iconName) {
            case 'Target': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
            case 'TrendingUp': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
            case 'CheckCircle': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
            case 'Plus': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
            case 'X': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
            case 'Edit': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
            case 'Trash2': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
            case 'Clock': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
            case 'User': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
            case 'Mail': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
            case 'Lock': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
            case 'LogOut': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
            case 'Zap': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
            case 'Sun': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
            case 'Moon': return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
            default: return <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/></svg>;
        }
    };
    return <span className={`icon ${className}`}>{getSvg(name)}</span>;
};


// Componente de entrada reutilizable
const InputField = ({ label, type = 'text', value, onChange, placeholder = '', iconName, required = false }) => (
    <div className="input-group">
        <label htmlFor={label.toLowerCase()} className="input-label">{label}</label>
        <div className="input-with-icon">
            <Icon name={iconName} className="input-icon" color="#6b7280" />
            <input
                id={label.toLowerCase()}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="input-field"
            />
        </div>
    </div>
);


// ---------------------------------------------------------------------
// --- Componente de Autenticación (Login/Registro) --------------------
// ---------------------------------------------------------------------

// El componente AuthModal, modificado para incluir el campo de nombre en el registro
const AuthModal = ({ isOpen, onClose, onAuthSuccess, mode, toggleMode, login, register, globalError }) => {
    // Estado para los campos del formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Nuevo estado para el nombre
    const [name, setName] = useState(''); 
    // Estado de carga y error local (para el formulario)
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    // Limpiar campos y errores al abrir/cambiar de modo
    useEffect(() => {
        setEmail('');
        setPassword('');
        setName('');
        setLocalError('');
    }, [mode, isOpen]);

    // Limpiar error global si se editan los campos
    useEffect(() => {
        if (globalError) setLocalError('');
    }, [email, password, name, globalError]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setIsLoading(true);

        try {
            let success = false; // 1. Inicializamos una variable para capturar el resultado.
            if (mode === 'login') {
                success = await login(email, password);
            } else {
                // Función register actualizada para pasar el nombre
                success = await register(email, password, name); 
            }
            if (success){
                onAuthSuccess();
            }
        } catch (err) {
            setLocalError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content auth-content">
                <button className="modal-close-btn" onClick={onClose} disabled={isLoading} aria-label="Cerrar">
                    <Icon name="X" className="icon-close" />
                </button>
                <h2 className="modal-title">
                    {mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                </h2>
                <p className="modal-subtitle">
                    {mode === 'login' ? 'Ingresa tus credenciales para continuar.' : 'Crea tu cuenta para empezar a registrar hábitos.'}
                </p>

                {(localError || globalError) && (
                    <div className="error-message">
                        {localError || globalError}
                    </div>
                )}

                <form className="form-content" onSubmit={handleSubmit}>
                    
                    {/* Campo de Nombre - SOLO visible en modo Registro */}
                    {mode === 'register' && (
                         <InputField 
                            label="Nombre"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tu nombre (ej: Pedro)"
                            iconName="User"
                            required
                        />
                    )}

                    {/* Campos de Email y Contraseña (Comunes) */}
                    <InputField 
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        iconName="Mail"
                        required
                    />
                    <InputField 
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        iconName="Lock"
                        required
                    />
                    
                    <button type="submit" className="button button-primary" disabled={isLoading}>
                        {isLoading ? 'Cargando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
                    </button>
                </form>

                <p className="auth-toggle-text">
                    {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}
                    <button 
                        type="button" 
                        onClick={toggleMode} 
                        className="button-link"
                        disabled={isLoading}
                    >
                        {mode === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
                    </button>
                </p>
            </div>
        </div>
    );
};


// ---------------------------------------------------------------------
// --- Componentes Existentes (Omitidos para no extender demasiado) ----
// ---------------------------------------------------------------------
// HabitoCard, HabitModal, Header, Footer, MetricCard... (código anterior)

// Componente Header (Actualizado para mostrar el nombre)
const Header = ({ user, isAuthenticated, logout }) => {
    // Si el usuario está autenticado, mostramos el saludo y el botón de logout
    const greeting = isAuthenticated 
        ? `Bienvenido, ${user?.name || user?.email || 'Usuario'}` // Usamos el nombre, con fallback al email si no existe (aunque ya lo implementamos)
        : 'Habit Tracker';

    return (
        <header className="header">
            <h1 className="header-title">
                <Icon name="Target" color="var(--color-primary)" className="mr-2" />
                {greeting}
            </h1>
            {isAuthenticated && (
                <button onClick={logout} className="button-logout" aria-label="Cerrar Sesión">
                    <Icon name="LogOut" color="#ef4444" className="w-6 h-6" />
                    <span className="ml-2 hidden sm:inline">Salir</span>
                </button>
            )}
        </header>
    );
};


// Componente para mostrar las métricas (código anterior)
const MetricCard = ({ icon, title, value, colorClass = 'text-gray-800' }) => (
    <div className="metric-card">
        <Icon name={icon} color={colorClass} className="w-6 h-6" />
        <div className="metric-info">
            <p className="metric-value" style={{ color: colorClass }}>{value}</p>
            <p className="metric-title">{title}</p>
        </div>
    </div>
);


// Componente que renderiza un solo hábito (código anterior)
const HabitoCard = ({ habito, cambiarEstado, eliminar, onEditClick }) => {
    const handleToggle = (e) => {
        e.stopPropagation(); // Evitar que el clic abra el modal si hay uno
        cambiarEstado(habito.id, habito.completedToday);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEditClick(habito);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        // Usamos un modal o confirmación simulada (No usar window.confirm)
        if (window.confirm(`¿Estás seguro de eliminar el hábito: "${habito.name}"? Esto borrará todas sus marcas de finalización.`)) {
            eliminar(habito.id);
        }
    };

    return (
        <div className={`habit-card ${habito.completedToday ? 'completed' : ''}`} style={{borderColor: habito.color}}>
            <div className="habit-info">
                <div className="habit-icon-circle" style={{backgroundColor: habito.color, opacity: 0.1}}>
                    <Icon name={habito.icon} color={habito.color} className="w-6 h-6" />
                </div>
                <div className="habit-text">
                    <h3 className="habit-name">{habito.name}</h3>
                    <p className="habit-streak">Racha actual: {habito.currentStreak} días <Icon name="Zap" color="#f59e0b" className="w-4 h-4 inline-block ml-1" /></p>
                </div>
            </div>
            
            <div className="habit-actions">
                <button onClick={handleEdit} className="habit-btn habit-btn-edit" title="Editar">
                    <Icon name="Edit" color="#4f46e5" className="w-5 h-5" />
                </button>
                <button onClick={handleDelete} className="habit-btn habit-btn-delete" title="Eliminar">
                    <Icon name="Trash2" color="#ef4444" className="w-5 h-5" />
                </button>
                <button onClick={handleToggle} className={`habit-btn habit-btn-toggle ${habito.completedToday ? 'checked' : 'unchecked'}`} title={habito.completedToday ? 'Desmarcar' : 'Marcar como Completado'}>
                    <Icon name="CheckCircle" color="white" className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

// Componente Modal de Agregar/Editar Hábito (código anterior)
const HabitModal = ({ isOpen, onClose, habitToEdit, onSave }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Target');
    const [color, setColor] = useState('#4f46e5');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!habitToEdit;

    useEffect(() => {
        if (habitToEdit) {
            setName(habitToEdit.name);
            setIcon(habitToEdit.icon);
            setColor(habitToEdit.color);
        } else {
            // Valores por defecto para agregar
            setName('');
            setIcon('Target');
            setColor('#4f46e5');
        }
        setError('');
    }, [habitToEdit, isOpen]); // Resetear cuando se abre o cambia el hábito a editar

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('El nombre del hábito no puede estar vacío.');
            return;
        }

        setIsLoading(true);
        const data = {
            name: name.trim(),
            icon,
            color,
        };
        
        if (isEditMode) {
            data.id = habitToEdit.id;
        }

        try {
            await onSave(data, isEditMode);
            onClose(); // Cerrar el modal al guardar
        } catch(err) {
            setError(err.message || "Error al guardar el hábito.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const availableIcons = ['Target', 'TrendingUp', 'Zap', 'Sun', 'Moon', 'Clock', 'User'];
    const availableColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

    return (
        <div className="modal-overlay">
            <div className="modal-content habit-modal-content">
                <button className="modal-close-btn" onClick={onClose} disabled={isLoading} aria-label="Cerrar">
                    <Icon name="X" className="icon-close" />
                </button>
                <h2 className="modal-title">{isEditMode ? 'Editar Hábito' : 'Nuevo Hábito'}</h2>
                <p className="modal-subtitle">Define tu nuevo objetivo diario.</p>

                {error && <div className="error-message">{error}</div>}

                <form className="form-content" onSubmit={handleSubmit}>
                    <InputField
                        label="Nombre del Hábito"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Beber 2L de agua"
                        iconName="Target"
                        required
                    />

                    {/* Selector de Icono */}
                    <div className="input-group">
                        <label className="input-label">Icono</label>
                        <div className="icon-picker-grid">
                            {availableIcons.map(i => (
                                <div
                                    key={i}
                                    className={`icon-picker-item ${icon === i ? 'selected' : ''}`}
                                    onClick={() => setIcon(i)}
                                    title={i}
                                    style={{ borderColor: icon === i ? color : undefined }}
                                >
                                    <Icon name={i} color={icon === i ? color : '#6b7280'} className="w-6 h-6" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selector de Color */}
                    <div className="input-group">
                        <label className="input-label">Color de Acento</label>
                        <div className="color-picker-grid">
                            {availableColors.map(c => (
                                <div
                                    key={c}
                                    className={`color-picker-item ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c, borderColor: color === c ? '#1f2937' : 'transparent' }}
                                    onClick={() => setColor(c)}
                                    title={c}
                                >
                                    {color === c && <Icon name="CheckCircle" color="white" className="w-4 h-4" />}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button type="submit" className="button button-primary" disabled={isLoading}>
                        {isLoading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Hábito')}
                    </button>
                </form>
            </div>
        </div>
    );
};


// Componente Footer (código anterior)
const Footer = () => (
    <footer className="footer">
        <p>Hecho con ❤️ para seguimiento de hábitos.</p>
    </footer>
);


// ---------------------------------------------------------------------
// --- Componente Principal (App) --------------------------------------
// ---------------------------------------------------------------------

const App = () => {
    const { 
        isAuthenticated, 
        user, 
        listaHabitos, 
        agregarHabito, 
        editarHabito,
        eliminarHabito,
        cambiarEstadoCompletado,
        login,
        register,
        logout,
        metricas,
        apiError,
        isInitialLoading
    } = useHabitosApi();

    // Estado del Modal de Hábito
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [habitToEdit, setHabitToEdit] = useState(null); // null para Agregar, objeto para Editar

    // Estado del Modal de Autenticación
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'

    // Efecto para abrir el modal de autenticación si no estamos logueados
    useEffect(() => {
        // Solo abrir al inicio si no estamos autenticados y no estamos en la carga inicial
        if (!isAuthenticated && !isInitialLoading) {
            setIsAuthModalOpen(true);
            setAuthMode('login');
        } else {
             setIsAuthModalOpen(false);
        }
    }, [isAuthenticated, isInitialLoading]);

    // Handlers para el Modal de Hábito
    const handleAddHabitClick = () => {
        setHabitToEdit(null); // Modo Agregar
        setIsModalOpen(true);
    };

    const handleEditHabit = (habit) => {
        setHabitToEdit(habit); // Modo Editar
        setIsModalOpen(true);
    };

    const handleSaveHabit = (data, isEdit) => {
        // Lógica de guardado se maneja dentro de HabitModal llamando a onSave (agregarHabito/editarHabito)
        if (isEdit) {
            return editarHabito(data, true);
        } else {
            return agregarHabito(data, false);
        }
    };
    
    // Handlers para el Modal de Autenticación
    const handleAuthSuccess = () => {
        setIsAuthModalOpen(false);
    };

    const toggleAuthMode = () => {
        setAuthMode(prev => prev === 'login' ? 'register' : 'login');
    };
    
    // Si la carga inicial es en progreso, mostramos un loader
    if (isInitialLoading) {
        return (
             <div className="loading-screen">
                <Icon name="Clock" className="spinner" color="#4f46e5" />
                <p>Cargando sesión...</p>
            </div>
        );
    }
    
    // Si no está autenticado, solo mostramos el modal de autenticación
    if (!isAuthenticated) {
        return (
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => {
                    // Prevenir el cierre si es la primera vez que inicia
                    if (!isAuthenticated) return; 
                    setIsAuthModalOpen(false)
                }}
                onAuthSuccess={handleAuthSuccess}
                mode={authMode}
                toggleMode={toggleAuthMode}
                login={login}
                register={register}
                globalError={apiError} 
            />
        );
    }

    // Contenido de la aplicación una vez autenticado
    return (
        <div className="app-container">
            <Header user={user} isAuthenticated={isAuthenticated} logout={logout} />

            <div className="content-area">
                
                {/* Métricas */}
                <div className="metric-grid">
                    <MetricCard 
                        icon="Target" 
                        title="Hábitos Activos" 
                        value={metricas.totalHabitos} 
                        colorClass="#4f46e5"
                    />
                    <MetricCard 
                        icon="CheckCircle" 
                        title="Completados Hoy" 
                        value={`${metricas.completadosHoy}/${metricas.totalHabitos}`}
                        colorClass="#10b981"
                    />
                    <MetricCard 
                        icon="TrendingUp" 
                        title="Cumplimiento Diario" 
                        value={`${metricas.porcentajeCumplimiento}%`}
                        colorClass={metricas.porcentajeCumplimiento >= 80 ? '#10b981' : (metricas.porcentajeCumplimiento >= 50 ? '#f59e0b' : '#ef4444')}
                    />
                    <MetricCard 
                        icon="Zap" 
                        title="Racha Promedio" 
                        value={`${metricas.promedioRacha} días`}
                        colorClass="#f59e0b"
                    />
                </div>

                {/* Encabezado de la lista de hábitos */}
                <div className="habit-list-header">
                    <h2 className="section-title">Mis Hábitos</h2>
                    <button onClick={handleAddHabitClick} className="button button-secondary" disabled={metricas.isLoading}>
                        <Icon name="Plus" className="w-5 h-5 mr-1" color="currentColor" />
                        {metricas.isLoading ? 'Cargando...' : 'Añadir Hábito'}
                    </button>
                </div>
                
                 {/* Mensaje de error (opcional) */}
                {apiError && <div className="error-message">{apiError}</div>}


                {/* Lista de Hábitos */}
                {metricas.isLoading ? (
                    <div className="loading-section">
                        <Icon name="Clock" className="spinner" color="#4f46e5" />
                        <p>Cargando hábitos...</p>
                    </div>
                ) : listaHabitos.length === 0 ? (
                    <div className="empty-state">
                        <Icon name="Sun" color="#6b7280" className="w-10 h-10" />
                        <p>Aún no tienes hábitos registrados. ¡Crea el primero!</p>
                        <button onClick={handleAddHabitClick} className="button button-primary mt-3">
                            <Icon name="Plus" className="w-5 h-5 mr-1" color="white" />
                            Añadir Hábito
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {listaHabitos.map(habito => (
                            <HabitoCard
                                key={habito.id}
                                habito={habito}
                                cambiarEstado={cambiarEstadoCompletado}
                                eliminar={eliminarHabito}
                                onEditClick={handleEditHabit}
                            />
                        ))}
                    </div>
                )}


                {/* Modal de Agregar/Editar Hábito */}
                <HabitModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    habitToEdit={habitToEdit}
                    onSave={handleSaveHabit}
                />

                {/* Modal de Autenticación (Se usa si el usuario hace logout y quiere volver a entrar) */}
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onAuthSuccess={handleAuthSuccess}
                    mode={authMode}
                    toggleMode={toggleAuthMode}
                    login={login}
                    register={register}
                    globalError={apiError} 
                />
            </div>
            
            <Footer /> 
        </div>
    );
};

export default App;