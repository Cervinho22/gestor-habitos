import { useState } from 'react';
import { useHabitos } from './hooks/useHabitos'; 
import './App.css'; 

// ----------------------------------------------------
// 1. COMPONENTE PARA UN HÁBITO INDIVIDUAL (MANEJA SU PROPIO MODO EDICIÓN)
// ----------------------------------------------------
function HabitoItem({ habito, eliminarHabito, cambiarEstadoCompletado, editarHabito }) {
  // Estado local para saber si estamos editando este hábito
  const [isEditing, setIsEditing] = useState(false);
  // Estados locales para los valores del formulario de edición
  const [editNombre, setEditNombre] = useState(habito.nombre);
  const [editFrecuencia, setEditFrecuencia] = useState(habito.frecuencia);

  // Maneja el guardado del hábito editado
  const handleGuardar = () => {
    if (editNombre.trim() === '') {
      return; 
    }
    editarHabito(habito.id, editNombre, editFrecuencia);
    setIsEditing(false);
  };

  // Determinar si la racha debe mostrarse
  const showRacha = habito.racha > 0;
  
  // ----------------------------------------------------
  // RENDERIZADO DEL HÁBITO
  // ----------------------------------------------------
  return (
    <li 
      className={habito.completado ? 'completado' : ''} 
    >
      {isEditing ? (
        // --- MODO EDICIÓN ---
        <div className="edicion-form">
          <input
            type="text"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            placeholder="Nuevo nombre"
          />
          <select
            value={editFrecuencia}
            onChange={(e) => setEditFrecuencia(e.target.value)}
          >
            <option value="diaria">Diaria</option>
            <option value="semanal">Semanal</option>
          </select>
          <button 
            onClick={handleGuardar}
            className="boton-guardar"
          >
            Guardar
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="boton-cancelar"
          >
            Cancelar
          </button>
        </div>
      ) : (
        // --- MODO VISUALIZACIÓN ---
        <>
          <span className="nombre-habito">
            {habito.nombre} 
            <small style={{marginLeft: '10px', color: '#6c757d'}}>
                ({habito.frecuencia})
            </small>
            {/* NUEVO: Mostrar la Racha */}
            {showRacha && (
                <span className="racha-tag">
                    🔥 {habito.racha} día{habito.racha > 1 ? 's' : ''}
                </span>
            )}
          </span>

          <div className="acciones">
            <button 
              onClick={() => cambiarEstadoCompletado(habito.id)}
              className="boton-toggle"
            >
              {habito.completado ? 'Deshacer' : 'Completar'}
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="boton-editar"
            >
              Editar
            </button>
            <button 
              onClick={() => eliminarHabito(habito.id)}
              className="boton-eliminar"
            >
              Eliminar
            </button>
          </div>
        </>
      )}
    </li>
  );
}


// ----------------------------------------------------
// 2. COMPONENTE PRINCIPAL (App)
// ----------------------------------------------------
export function App() {
  const { 
    listaHabitos, 
    agregarHabito, 
    eliminarHabito, 
    cambiarEstadoCompletado,
    editarHabito,
    metricas 
  } = useHabitos(); 

  const [nombreHabito, setNombreHabito] = useState('');
  const [frecuenciaSeleccionada, setFrecuenciaSeleccionada] = useState('diaria'); 

  const manejarEnvio = (evento) => {
    evento.preventDefault(); 
    
    const nombreLimpio = nombreHabito.trim();
    if (nombreLimpio === '') {
      return; 
    }
    
    agregarHabito(nombreLimpio, frecuenciaSeleccionada); 
    setNombreHabito(''); 
    setFrecuenciaSeleccionada('diaria'); 
  };

  return (
    <div className="contenedor-app">
      <h1>Gestor de Hábitos</h1>
      
      {/* PANEL DE MÉTRICAS */}
      <div className="panel-metricas">
        <div className="metrica-card">
          <h3>Total Hábitos</h3>
          <p>{metricas.totalHabitos}</p>
        </div>
        <div className="metrica-card">
          <h3>Completados Hoy</h3>
          <p>{metricas.completadosHoy}</p>
        </div>
        <div className="metrica-card cumplimiento">
          <h3>Cumplimiento</h3>
          <p>{metricas.porcentajeCumplimiento}%</p>
        </div>
      </div>

      {/* Formulario de Añadir */}
      <form onSubmit={manejarEnvio}>
        <input
          type="text"
          placeholder="Ej: Leer 10 págs o 30 min de ejercicio"
          value={nombreHabito}
          onChange={(e) => setNombreHabito(e.target.value)}
        />
        
        <select
          value={frecuenciaSeleccionada}
          onChange={(e) => setFrecuenciaSeleccionada(e.target.value)}
        >
          <option value="diaria">Diaria</option>
          <option value="semanal">Semanal</option>
        </select>
        
        <button type="submit">Añadir Hábito</button>
      </form>

      {/* Lista de Hábitos */}
      <div className="lista-habitos">
        <h2>Mis Hábitos ({listaHabitos.length})</h2>
        {listaHabitos.length === 0 
          ? (<p>Aún no tienes hábitos registrados. ¡Empieza a construir uno!</p>) 
          : (
            <ul>
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
  );
}