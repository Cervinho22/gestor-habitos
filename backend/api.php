<?php
// ¡IMPORTANTE! Suprime errores menores y advertencias de PHP para no romper la salida JSON.
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// Configuración de cabeceras para CORS y JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejo de la solicitud OPTIONS (necesario para CORS pre-flight requests)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Cargar configuración de la base de datos
require_once 'db_config.php'; 

// 2. Intentar establecer la conexión PDO
$pdo = null;
try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (\PDOException $e) {
    // Si falla la conexión, enviamos el error DIRECTO y terminamos la ejecución
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión a la base de datos. Verifique db_config.php y credenciales."]);
    exit();
}

// 3. Funciones de Autenticación y Utilidad
function getUserId($pdo) {
    // Busca el token en el encabezado Authorization (Bearer Token)
    $headers = getallheaders();
    // Normalizar la búsqueda del header (Apache/Nginx a veces lo cambia)
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    
    // Fallback para servidores (como Apache) que no pasan 'Authorization' por defecto
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        
        // Consulta la tabla auth_tokens para obtener el user_id
        $stmt = $pdo->prepare("SELECT user_id FROM auth_tokens WHERE token = ? AND expiry_date > NOW()");
        $stmt->execute([$token]);
        $result = $stmt->fetch();

        if ($result) {
            return $result['user_id'];
        }
    }
    return null; // No autenticado
}

function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function generateToken() {
    return bin2hex(random_bytes(32)); // Token de 64 caracteres
}

function getSessionToken() {
    // Busca el token en el encabezado Authorization (Bearer Token)
    $headers = getallheaders();
    // Normalizar la búsqueda del header (Apache/Nginx a veces lo cambia)
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    
    // Fallback para servidores (como Apache) que no pasan 'Authorization' por defecto
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        return $matches[1];
    }
    return null; // No se encontró el token
}


// 4. Determinar la ruta y el método
$method = $_SERVER['REQUEST_METHOD'];

// ----------------------------------------------------
// --- LÓGICA DE ROUTING (CORREGIDA) ---
// ----------------------------------------------------

// Esta lógica extrae la ruta (ej: /login o /habits/1) 
// que viene *después* de 'api.php/'
$script_name = $_SERVER['SCRIPT_NAME']; // /backend/api.php
$request_uri = $_SERVER['REQUEST_URI']; // /backend/api.php/logout

// Quita cualquier query string (ej: ?id=1)
$request_uri = strtok($request_uri, '?'); 

$route = '';
// Encuentra la ruta base del script
$base_path = dirname($script_name);
// Aseguramos que la base_path no sea solo '/' si está en la raíz
$base_path = ($base_path === '/' || $base_path === '\\') ? '' : $base_path; 

// Si la URI contiene el nombre del script (ej: /backend/api.php/logout)
if (strpos($request_uri, $script_name) === 0) {
    $route = (string)substr($request_uri, strlen($script_name));
} 
// Si la URI *no* contiene api.php (ej: /backend/logout) gracias a .htaccess
elseif (strpos($request_uri, $base_path) === 0) {
     $route = (string)substr($request_uri, strlen($base_path));
}

$route = trim($route, '/');
$parts = explode('/', $route);
// ----------------------------------------------------

$resource = $parts[0] ?? '';
$id = $parts[1] ?? null;

// Datos del cuerpo de la solicitud (para POST, PUT, DELETE)
$input = json_decode(file_get_contents('php://input'), true) ?? []; // Asegura que $input sea un array si está vacío

// 5. Enrutamiento Principal

// 5a. RUTAS PÚBLICAS (No requieren autenticación)
// ---------------------------------------------
switch ($resource) {
    case 'status':
        sendJson(["success" => true, "message" => "API funcionando."], 200);
    
    // --- AUTENTICACIÓN: REGISTRO ---
    case 'register':
        if ($method === 'POST') {
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            $name = $input['name'] ?? ''; // <-- ¡CORREGIDO! No asignamos 'Usuario' por defecto

            if (empty($email) || empty($password) || empty($name)) { // La validación es correcta
                sendJson(["success" => false, "message" => "Nombre, email y contraseña son obligatorios."], 400);
            }

            try {
                // Verificar si el usuario ya existe
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$email]);
                if ($stmt->fetch()) {
                    sendJson(["success" => false, "message" => "El correo ya está registrado."], 409);
                }

                // Crear usuario
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
                $stmt->execute([$name, $email, $hashed_password]);
                $userId = $pdo->lastInsertId();

                // Generar token de autenticación y loguear
                $token = bin2hex(random_bytes(32)); // 64 caracteres
                $expiry_date = date('Y-m-d H:i:s', strtotime('+7 day'));
                $stmt = $pdo->prepare("INSERT INTO auth_tokens (user_id, token, expiry_date) VALUES (?, ?, ?)");
                $stmt->execute([$userId, $token, $expiry_date]);
                
                // Obtener datos del usuario para el frontend
                $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();

                sendJson([
                    "success" => true,
                    "message" => "Registro exitoso. Bienvenido.",
                    "token" => $token,
                    "user" => $user
                ], 201);

            } catch (\PDOException $e) {
                sendJson(["success" => false, "message" => "Error al registrar: " . $e->getMessage()], 500);
            }
        } else {
             sendJson(["success" => false, "message" => "Método no permitido para esta ruta."], 405);
        }
        break; 
    
    // --- AUTENTICACIÓN: LOGIN ---
    case 'login':
        if ($method === 'POST') {
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';

            if (empty($email) || empty($password)) {
                sendJson(["success" => false, "message" => "Debe proporcionar correo y contraseña."], 400);
            }

            try {
                $stmt = $pdo->prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();

                if ($user && password_verify($password, $user['password_hash'])) {
                    $token = bin2hex(random_bytes(32));
                    $expiry_date = date('Y-m-d H:i:s', strtotime('+7 day'));
                    
                    $pdo->prepare("DELETE FROM auth_tokens WHERE user_id = ?")->execute([$user['id']]);
                    $pdo->prepare("INSERT INTO auth_tokens (user_id, token, expiry_date) VALUES (?, ?, ?)")->execute([$user['id'], $token, $expiry_date]);
                    
                    $userData = ["id" => $user['id'], "name" => $user['name'], "email" => $user['email']];

                    sendJson([
                        "success" => true,
                        "message" => "Login exitoso. Bienvenido.",
                        "token" => $token,
                        "user" => $userData
                    ]);
                } else {
                    sendJson(["success" => false, "message" => "Credenciales incorrectas."], 401);
                }
            } catch (\PDOException $e) {
                sendJson(["success" => false, "message" => "Error de login: " . $e->getMessage()], 500);
            }
        } else {
             sendJson(["success" => false, "message" => "Método no permitido para esta ruta."], 405);
        }
        break;
}

// 5b. Comprobar autenticación para RUTAS PROTEGIDAS
// -------------------------------------------------
$userId = getUserId($pdo); 

if (!$userId) {
    sendJson(["success" => false, "message" => "Acceso no autorizado. Inicie sesión."], 401);
}

// 5c. Manejar Rutas Protegidas (Requieren $userId válido)
// -------------------------------------------------------
switch ($resource) {
    // --- USUARIO: OBTENER DATOS DEL USUARIO LOGUEADO (Protegida) ---
    case 'user':
        if ($method === 'GET') {
            try {
                $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                sendJson(["success" => true, "user" => $user]);
            } catch (\PDOException $e) {
                sendJson(["success" => false, "message" => "Error al obtener usuario: " . $e->getMessage()], 500);
            }
        }
        break;

    // --- HÁBITOS: OBTENER LISTA ---
    case 'habits':
        if ($method === 'GET') {
            try {
                // Seleccionar hábitos del usuario, y verificar si están completados hoy
                $stmt = $pdo->prepare("
                    SELECT 
                        h.id, h.name, h.description, h.icon, h.color, h.current_streak, h.longest_streak,
                        (
                            SELECT COUNT(id) 
                            FROM habit_completions 
                            WHERE habit_id = h.id 
                            AND completion_date = CURDATE()
                        ) AS completedToday
                    FROM habits h
                    WHERE h.user_id = ?
                    ORDER BY h.created_at DESC
                ");
                $stmt->execute([$userId]);
                $habits = $stmt->fetchAll();
                
                // Convertir 'completedToday' a booleano en PHP
                $habits = array_map(function($h) {
                    $h['completedToday'] = (bool)$h['completedToday'];
                    return $h;
                }, $habits);
                
                sendJson(["success" => true, "habits" => $habits]); 

            } catch (\PDOException $e) {
                sendJson(["success" => false, "message" => "Error al obtener hábitos: " . $e->getMessage()], 500);
            }
        
        // --- HÁBITOS: CREAR/EDITAR ---
        } elseif ($method === 'POST' || $method === 'PUT') {
            $name = $input['name'] ?? '';
            $description = $input['description'] ?? '';
            $icon = $input['icon'] ?? 'Target';
            $color = $input['color'] ?? '#4f46e5'; 

            if (empty($name)) {
                sendJson(["success" => false, "message" => "El nombre del hábito es obligatorio."], 400);
            }

            try {
                if ($method === 'POST') {
                    // CREAR NUEVO HÁBITO
                    $stmt = $pdo->prepare("INSERT INTO habits (user_id, name, description, icon, color, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
                    $stmt->execute([$userId, $name, $description, $icon, $color]);
                    $newHabitId = $pdo->lastInsertId();
                    
                    // Devolvemos el hábito completo
                    $stmt_get = $pdo->prepare("SELECT * FROM habits WHERE id = ?");
                    $stmt_get->execute([$newHabitId]);
                    $newHabit = $stmt_get->fetch();
                    $newHabit['completedToday'] = false; // Es nuevo
                    
                    sendJson(["success" => true, "message" => "Hábito creado.", "habit" => $newHabit], 201);
                    
                } else { // PUT (Editar)
                    if (!$id) { // El ID viene de la URL (ej: /habits/123)
                         $id = $input['id'] ?? null; // O del body
                    }
                    if (!$id) {
                        sendJson(["success" => false, "message" => "ID del hábito es obligatorio para editar."], 400);
                    }
                    
                    $stmt = $pdo->prepare("UPDATE habits SET name = ?, description = ?, icon = ?, color = ? WHERE id = ? AND user_id = ?");
                    $stmt->execute([$name, $description, $icon, $color, $id, $userId]);
                    
                    if ($stmt->rowCount() > 0) {
                         // Devolvemos el hábito actualizado
                        $stmt_get = $pdo->prepare("SELECT * FROM habits WHERE id = ?");
                        $stmt_get->execute([$id]);
                        $updatedHabit = $stmt_get->fetch();
                        // Necesitamos calcular el completedToday y racha aquí también
                        $updatedHabit['completedToday'] = false; // Asumir
                        $updatedHabit['currentStreak'] = $updatedHabit['current_streak'];
                        
                        sendJson(["success" => true, "message" => "Hábito actualizado.", "habit" => $updatedHabit]);
                    } else {
                        sendJson(["success" => false, "message" => "Hábito no encontrado o no autorizado."], 404);
                    }
                }
            } catch (\PDOException $e) {
                sendJson(["success" => false, "message" => "Error al guardar el hábito: " . $e->getMessage()], 500);
            }
        
        // --- HÁBITOS: ELIMINAR ---
        } elseif ($method === 'DELETE') {
            if (!$id) { // El ID viene de la URL (ej: /habits/123)
                $id = $input['id'] ?? null; // O del body
            }
            if (!$id) {
                sendJson(["success" => false, "message" => "ID del hábito es obligatorio para eliminar."], 400);
            }

            try {
                $stmt = $pdo->prepare("DELETE FROM habits WHERE id = ? AND user_id = ?");
                $stmt->execute([$id, $userId]);

                if ($stmt->rowCount() > 0) {
                    sendJson(["success" => true, "message" => "Hábito eliminado exitosamente."]);
                } else {
                    sendJson(["success" => false, "message" => "Hábito no encontrado o no autorizado."], 404);
                }
            } catch (\PDOException $e) {
                sendJson(["success" => false, "message" => "Error al eliminar el hábito: " . $e->getMessage()], 500);
            }
        }
        break;

    // --- HÁBITO: MARCAR COMO COMPLETADO/INCOMPLETADO ---
    case 'complete':
        if ($method === 'POST') {
            $habitId = $input['habitId'] ?? null;
            $isCompleted = (bool)($input['isCompleted'] ?? false); // Estado *actual*

            if (!$habitId) {
                sendJson(["success" => false, "message" => "ID del hábito es obligatorio."], 400);
            }

            try {
                // 1. Verificar si el hábito existe y pertenece al usuario
                $stmt = $pdo->prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?");
                $stmt->execute([$habitId, $userId]);
                if (!$stmt->fetch()) {
                    sendJson(["success" => false, "message" => "Hábito no encontrado o no autorizado."], 404);
                }

                $today = date('Y-m-d');
                
                // El frontend envía el estado actual (isCompleted). 
                // Si está completado (true), lo queremos desmarcar (false).
                // Si está incompleto (false), lo queremos marcar (true).
                $newState = !$isCompleted; 

                if ($newState) {
                    // MARCAR COMO COMPLETADO
                    $stmt = $pdo->prepare("INSERT IGNORE INTO habit_completions (habit_id, completion_date) VALUES (?, ?)");
                    $stmt->execute([$habitId, $today]);
                    
                    // Lógica de Racha (Simplificada)
                    $pdo->prepare("UPDATE habits SET current_streak = current_streak + 1 WHERE id = ?")->execute([$habitId]);
                    sendJson(["success" => true, "message" => "Hábito marcado como completado."]);

                } else {
                    // DESMARCAR COMO INCOMPLETADO
                    $stmt = $pdo->prepare("DELETE FROM habit_completions WHERE habit_id = ? AND completion_date = ?");
                    $stmt->execute([$habitId, $today]);
                    
                    // Lógica de Racha (Simplificada)
                    $pdo->prepare("UPDATE habits SET current_streak = GREATEST(0, current_streak - 1) WHERE id = ?")->execute([$habitId]);
                    sendJson(["success" => true, "message" => "Hábito desmarcado."]);
                }

            } catch (\PDOException $e) {
                sendJson(["success" => false, "message" => "Error al modificar estado del hábito: " . $e->getMessage()], 500);
            }
        } else {
             sendJson(["success" => false, "message" => "Método no permitido para esta ruta."], 405);
        }
        break;

// --- CERRAR SESIÓN ---
    case 'logout':
        if ($method === 'POST') {
            $token = getSessionToken(); // <-- ¡CORREGIDO! Ahora la función existe

            if ($token) {
                // DELETE requiere el token para identificar la fila a borrar
                $stmt = $pdo->prepare("DELETE FROM auth_tokens WHERE token = ? AND user_id = ?");
                // $userId lo obtuviste con getUserId($pdo) antes del case, 
                // por lo que sabes que es válido para el token
                $stmt->execute([$token, $userId]); 
            }
            // Devolver siempre éxito para no revelar si el token falló o no
            sendJson(["success" => true, "message" => "Sesión cerrada exitosamente."]);
        }
        break;
        
    default:
        sendJson(["success" => false, "message" => "Ruta no encontrada (Protegida): " . $resource], 404);
}

// Si llega aquí sin un 'exit()', es un error 404 general.
if (!headers_sent()) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Ruta no encontrada (Default)."]);
}
?>