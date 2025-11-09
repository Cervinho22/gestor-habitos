import { useState } from 'react';
import { useHabitos } from './hooks/useHabitos'; 
import './App.css'; 

// Exportación Nombrada (coincide con el import { App } en main.jsx)
export function App() { 
  // 1. Obtener la lista y las funciones del gancho (useHabitos)
  const { 
    listaHabitos, 
    agregarHabito, 
    eliminarHabito, 
    cambiarEstadoCompletado 
  } = useHabitos(); 

  // 2. Estado local para el input del nombre
  const [nombreHabito, setNombreHabito] = useState('');
  
  // 3. Estado local para la selección de frecuencia (diaria por defecto)
  const [frecuenciaSeleccionada, setFrecuenciaSeleccionada] = useState('diaria'); 

  // 4. Manejador del formulario de añadir
  const manejarEnvio = (evento) => {
    evento.preventDefault(); 
    
    const nombreLimpio = nombreHabito.trim();
    if (nombreLimpio === '') {
      return; 
    }
    
    // Llamamos a la función del gancho y le pasamos los dos datos
    agregarHabito(nombreLimpio, frecuenciaSeleccionada); 
    
    setNombreHabito(''); // Limpiamos el input
    setFrecuenciaSeleccionada('diaria'); // Reiniciamos el selector
  };

  return (
    <div className="contenedor-app">
      <h1>Gestor de Hábitos</h1>
      
      {/* Formulario para añadir hábito */}
      <form onSubmit={manejarEnvio} className="form-agregar">
        <input
          type="text"
          placeholder="Ej: Leer 10 págs o 30 min de ejercicio"
          value={nombreHabito}
          onChange={(e) => setNombreHabito(e.target.value)}
          aria-label="Nombre del Hábito"
        />
        
        {/* Selector de Frecuencia */}
        <select
          value={frecuenciaSeleccionada}
          onChange={(e) => setFrecuenciaSeleccionada(e.target.value)}
          aria-label="Frecuencia"
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
          ? (<p className="mensaje-vacio">Aún no tienes hábitos registrados. ¡Empieza a construir uno!</p>) 
          : (
            <ul>
              {listaHabitos.map(habito => (
                <li 
                  key={habito.id}
                  // Si está completado, añade la clase 'completado'
                  className={habito.completado ? 'completado' : ''} 
                >
                  <span className="nombre-habito">
                    {habito.nombre} 
                    {/* Mostramos la frecuencia en minúsculas */}
                    <small className="frecuencia">
                        ({habito.frecuencia})
                    </small>
                  </span>

                  <div className="acciones">
                    <button 
                      onClick={() => cambiarEstadoCompletado(habito.id)}
                      className="boton-toggle"
                      aria-label={habito.completado ? 'Deshacer cumplimiento' : 'Marcar como completado'}
                    >
                      {habito.completado ? 'Deshacer' : 'Completar'}
                    </button>
                    <button 
                      onClick={() => eliminarHabito(habito.id)}
                      className="boton-eliminar"
                      aria-label="Eliminar Hábito"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </div>
  );
}