<?php
use App\Http\Controllers\HabitController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/habits', [HabitController::class, 'index']);
    Route::post('/habits', [HabitController::class, 'store']);
    Route::get('/habits/{habitId}', [HabitController::class, 'show']);
    Route::put('/habits/{habitId}', [HabitController::class, 'update']);
    Route::delete('/habits/{habitId}', [HabitController::class, 'destroy']);
    Route::post('/habits/{habitId}/toggle', [HabitController::class, 'toggleCompletion']);
});