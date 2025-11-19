<?php
// Credenciales de la Base de Datos
$host = '127.0.0.1'; // Generalmente 'localhost' o '127.0.0.1'
$db   = 'habit_tracker'; // Nombre de la base de datos
$username = 'root'; // ¡CORREGIDO! Ahora se llama $username
$password = ''; // ¡CORREGIDO! Ahora se llama $password

// Configuración de la conexión PDO
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
?>