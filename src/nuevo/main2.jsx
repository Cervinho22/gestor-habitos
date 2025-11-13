// src/main.jsx - Archivo de configuración inicial de React

import React from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';

// Importamos el componente principal renombrado
import App2 from './App2.jsx'; 

// Si también has creado un App2.css, lo importarías aquí:
// import './App2.css'; 
// Dado que no te lo he pasado, si tienes estilos externos, cárgalos en el HTML.

// Si quieres usar el App.css que te pasé, asegúrate de que esté en la misma carpeta:
import './App.css'; 

// Renderiza la aplicación en el elemento 'root' del HTML
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App2 />
  </React.StrictMode>
);