// src/main.jsx - Archivo de configuración inicial de React

// Importaciones locales requeridas para el entorno Vite/npm
import React from 'react';
import ReactDOM from 'react-dom/client';

// 1. Importamos el componente principal CORRECTO
import App from './App.jsx'; 

// 2. Importamos los estilos (asegúrate de que src/App.css exista)
import './App.css'; 

// Renderiza la aplicación en el elemento 'root' del HTML
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* Usamos el componente App importado */}
  </React.StrictMode>
);