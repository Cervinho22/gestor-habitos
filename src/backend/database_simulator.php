<?php
// backend/database_simulator.php

// Define el path al archivo JSON que simula la base de datos
define('DB_FILE', 'simulated_db.json');

/**
 * Carga el contenido del archivo JSON de la "base de datos".
 * @return array Los datos completos de la base de datos.
 */
function loadDB() {
    if (!file_exists(DB_FILE)) {
        // Inicializa la estructura si el archivo no existe
        return ['users' => [], 'habits' => []];
    }
    $json = file_get_contents(DB_FILE);
    // Devuelve el array decodificado, o la estructura inicial si falla la decodificación
    return json_decode($json, true) ?? ['users' => [], 'habits' => []];
}

/**
 * Guarda el array de datos en el archivo JSON.
 * @param array $data Los datos a guardar.
 */
function saveDB(array $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT);
    file_put_contents(DB_FILE, $json);
}

// --- Funciones de Autenticación (Auth) ---

/**
 * Registra un nuevo usuario.
 * @param string $username Nombre de usuario.
 * @param string $password Contraseña (se hashea).
 * @return array|false El nuevo usuario o false si el nombre de usuario ya existe.
 */
function registerUser($username, $password) {
    $db = loadDB();

    // 1. Verificar si el usuario ya existe
    foreach ($db['users'] as $user) {
        if ($user['username'] === $username) {
            return false; // Usuario ya existe
        }
    }

    // 2. Crear nuevo usuario
    $userId = uniqid('user_');
    $newUser = [
        'id' => $userId,
        'username' => $username,
        // Almacenar el hash de la contraseña (nunca la contraseña en texto plano)
        'passwordHash' => password_hash($password, PASSWORD_DEFAULT),
    ];

    $db['users'][] = $newUser;
    saveDB($db);

    // Devolver solo los datos seguros del usuario
    return ['id' => $userId, 'username' => $username];
}

/**
 * Inicia sesión de un usuario.
 * @param string $username Nombre de usuario.
 * @param string $password Contraseña.
 * @return array|false Los datos del usuario (sin hash) o false si las credenciales son incorrectas.
 */
function loginUser($username, $password) {
    $db = loadDB();

    foreach ($db['users'] as $user) {
        if ($user['username'] === $username) {
            // Verificar la contraseña hasheada
            if (password_verify($password, $user['passwordHash'])) {
                // Devolver solo los datos seguros
                return ['id' => $user['id'], 'username' => $user['username']];
            }
            break; // Usuario encontrado, pero contraseña incorrecta
        }
    }
    return false; // Usuario no encontrado o credenciales incorrectas
}

// --- Funciones de Hábitos (CRUD) ---

/**
 * Obtiene todos los hábitos de un usuario.
 * @param string $userId ID del usuario.
 * @return array Lista de hábitos del usuario.
 */
function getHabits($userId) {
    $db = loadDB();
    $userHabits = [];

    // Filtrar los hábitos que pertenecen a este usuario
    foreach ($db['habits'] as $habit) {
        if ($habit['userId'] === $userId) {
            $userHabits[] = $habit;
        }
    }
    return $userHabits;
}

/**
 * Agrega un nuevo hábito.
 * @param string $userId ID del usuario.
 * @param string $name Nombre del hábito.
 * @param string $description Descripción.
 * @return array El hábito recién creado.
 */
function addHabit($userId, $name, $description) {
    $db = loadDB();
    $habitId = uniqid('habit_');
    $newHabit = [
        'id' => $habitId,
        'userId' => $userId,
        'name' => $name,
        'description' => $description,
        'completed' => false,
        'createdAt' => time() // Marca de tiempo de creación
    ];

    $db['habits'][] = $newHabit;
    saveDB($db);

    return $newHabit;
}

/**
 * Actualiza un hábito existente.
 * @param string $userId ID del usuario.
 * @param string $habitId ID del hábito a actualizar.
 * @param array $updates Los campos a modificar (ej. ['name' => 'Nuevo Nombre']).
 * @return array|false El hábito actualizado o false si no se encuentra o no pertenece al usuario.
 */
function updateHabit($userId, $habitId, $updates) {
    $db = loadDB();
    $updatedHabit = false;

    foreach ($db['habits'] as $index => $habit) {
        if ($habit['id'] === $habitId && $habit['userId'] === $userId) {
            // Aplicar las actualizaciones, evitando modificar 'id' y 'userId'
            $db['habits'][$index] = array_merge($habit, $updates);
            // Asegurar que 'completed' sea un booleano
            if (isset($db['habits'][$index]['completed'])) {
                 $db['habits'][$index]['completed'] = (bool)$db['habits'][$index]['completed'];
            }
            $updatedHabit = $db['habits'][$index];
            break;
        }
    }

    if ($updatedHabit) {
        saveDB($db);
        return $updatedHabit;
    }
    return false;
}

/**
 * Elimina un hábito.
 * @param string $userId ID del usuario.
 * @param string $habitId ID del hábito a eliminar.
 * @return bool True si se eliminó, false si no se encontró o no pertenece al usuario.
 */
function deleteHabit($userId, $habitId) {
    $db = loadDB();
    $initialCount = count($db['habits']);

    // Filtrar la lista, manteniendo solo los hábitos que NO coincidan con el ID y el UserId
    $db['habits'] = array_filter($db['habits'], function($habit) use ($habitId, $userId) {
        return !($habit['id'] === $habitId && $habit['userId'] === $userId);
    });

    // Reindexar el array después de filtrar
    $db['habits'] = array_values($db['habits']);

    $finalCount = count($db['habits']);

    if ($finalCount < $initialCount) {
        saveDB($db);
        return true;
    }
    return false;
}
?>