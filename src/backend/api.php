<?php
// backend/api.php
require 'database_simulator.php';

// Configuración de cabeceras para CORS y tipo de contenido
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Permite peticiones desde cualquier origen (para desarrollo)
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar la petición OPTIONS previa al CORS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Autenticación y Token ---

// Función para generar un token de sesión (muy simple, solo para simulación)
function generateAuthToken($userId) {
    // En un entorno real, usa JWT. Aquí, un simple base64 codificado.
    return base64_encode(json_encode(['userId' => $userId, 'expires' => time() + (60 * 60 * 24)]));
}

// Función para decodificar y validar el token
function validateAuthToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = json_decode(base64_decode($token), true);

        // Simple validación: verificar si el userId existe y si el token no ha expirado
        if ($payload && isset($payload['userId']) && isset($payload['expires']) && $payload['expires'] > time()) {
            return $payload['userId']; // Devuelve el ID del usuario
        }
    }
    return false; // Token inválido o no presente
}

// --- Funciones de Respuesta ---

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode(['success' => true, 'data' => $data]);
    exit();
}

function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'error' => $message]);
    exit();
}

// Obtener datos del cuerpo de la petición (para POST, PUT, DELETE)
$input = json_decode(file_get_contents('php://input'), true);

// --- Manejo de Rutas ---

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathSegments = explode('/', trim($requestUri, '/'));
// El 'end' toma el último segmento de la URL, que es la ruta de la API (ej. 'api.php/register' -> 'register')
$route = end($pathSegments);


// --- Rutas de Autenticación (Login / Register) ---

if ($route === 'register' || $route === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Método no permitido', 405);
    }

    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($username) || empty($password)) {
        sendError('Nombre de usuario y contraseña son requeridos.', 400);
    }

    if ($route === 'register') {
        $user = registerUser($username, $password);
        if ($user) {
            $token = generateAuthToken($user['id']);
            // 201 Created para nuevo recurso
            sendResponse(['user' => $user, 'token' => $token], 201); 
        } else {
            // 409 Conflict si el recurso ya existe
            sendError('El nombre de usuario ya está en uso.', 409);
        }
    } elseif ($route === 'login') {
        $user = loginUser($username, $password);
        if ($user) {
            $token = generateAuthToken($user['id']);
            sendResponse(['user' => $user, 'token' => $token]);
        } else {
            // 401 Unauthorized para credenciales incorrectas
            sendError('Credenciales incorrectas.', 401); 
        }
    }
    exit();
}


// --- Rutas de Hábitos (Requiere Autenticación) ---

// Intentar validar el token de autenticación
$userId = validateAuthToken();
if (!$userId) {
    // Si la ruta no es de auth y el token no es válido
    sendError('Acceso denegado. Se requiere autenticación.', 401);
}

// Ruta para gestionar los hábitos
if ($route === 'habits') {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Obtener todos los hábitos del usuario
            $habits = getHabits($userId);
            sendResponse($habits);
            break;

        case 'POST':
            // Crear un nuevo hábito
            $name = $input['name'] ?? '';
            $description = $input['description'] ?? '';

            if (empty($name)) {
                sendError('El nombre del hábito es obligatorio.', 400);
            }

            $newHabit = addHabit($userId, $name, $description);
            sendResponse($newHabit, 201);
            break;

        case 'PUT':
            // Actualizar un hábito existente
            $habitId = $input['id'] ?? '';
            $updates = $input;

            if (empty($habitId)) {
                 sendError('Se requiere el ID del hábito para actualizar.', 400);
            }

            // Eliminar el ID para que no se intente actualizar dentro de la función
            unset($updates['id']);

            $updatedHabit = updateHabit($userId, $habitId, $updates);

            if ($updatedHabit) {
                sendResponse($updatedHabit);
            } else {
                sendError('Hábito no encontrado o no autorizado.', 404);
            }
            break;

        case 'DELETE':
            // Eliminar un hábito
            $habitId = $input['id'] ?? '';
             if (empty($habitId)) {
                sendError('Se requiere el ID del hábito para eliminar.', 400);
            }

            if (deleteHabit($userId, $habitId)) {
                sendResponse(['message' => 'Hábito eliminado con éxito.']);
            } else {
                sendError('Hábito no encontrado o no autorizado.', 404);
            }
            break;

        default:
            sendError('Método no soportado para esta ruta.', 405);
            break;
    }
} else {
    // Si ninguna ruta coincide
    sendError('Ruta no encontrada.', 404);
}
?>
