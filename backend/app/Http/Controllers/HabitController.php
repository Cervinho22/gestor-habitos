<?php

namespace App\Http\Controllers;

use App\Models\Habit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class HabitController extends Controller
{
    /**
     * Función de autorización centralizada.
     */
    private function authorizeHabit(Habit $habit, Request $request)
    {
        if (!$request->user()) {
            abort(403, 'No autenticado.');
        }

        if ($habit->user_id !== $request->user()->id) {
            abort(403, 'No tienes permiso para acceder a este hábito.');
        }
    }

    /**
     * Muestra la lista de hábitos del usuario autenticado.
     */
    public function index(Request $request)
    {
        $user = $request->user(); 

        try {
            $habits = Habit::where('user_id', $user->id)
                            ->orderBy('created_at', 'desc')
                            ->get(); 
            
            return response()->json([
                'status' => 'success',
                'habits' => $habits
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error al cargar hábitos para user {$user->id}: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al cargar los hábitos.'
            ], 500);
        }
    }

    /**
     * Almacena un nuevo hábito para el usuario autenticado.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'frequency' => 'required|in:diaria,semanal',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos de hábito inválidos.', 'errors' => $validator->errors()], 422);
        }

        $habit = Habit::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'frequency' => $request->frequency,
            'current_streak' => 0,
            'last_completed_at' => null,
        ]);

        return response()->json($habit, 201);
    }

    /**
     * Muestra un hábito específico.
     */
    public function show(Request $request, $habitId)
    {
        $habit = Habit::find($habitId);
        
        if (!$habit) {
            return response()->json(['error' => 'Hábito no encontrado'], 404);
        }
        $this->authorizeHabit($habit, $request);
        
        return response()->json($habit);
    }

    /**
     * Actualiza un hábito existente.
     */
    public function update(Request $request, $habitId)
    {
        $habit = Habit::find($habitId);
        
        if (!$habit) {
            return response()->json(['error' => 'Hábito no encontrado'], 404);
        }
        $this->authorizeHabit($habit, $request);
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'frequency' => 'required|in:diaria,semanal',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos de hábito inválidos.', 'errors' => $validator->errors()], 422);
        }
        $habit->update($request->only('name', 'frequency'));

        return response()->json($habit, 200);
    }

    /**
     * Elimina un hábito.
     */
    public function destroy(Request $request, $habitId)
    {
        $habit = Habit::find($habitId);
        
        if (!$habit) {
            return response()->json(['error' => 'Hábito no encontrado'], 404);
        }
        $this->authorizeHabit($habit, $request);
        $habit->delete();
        
        return response()->json(null, 204);
    }

    /**
     * Alterna (toggle) el estado de completado del hábito.
     */
    public function toggleCompletion(Request $request, $habitId)
    {
        $habit = Habit::find($habitId);
        
        if (!$habit) {
            Log::error("❌ ERROR: Hábito con ID {$habitId} no encontrado");
            return response()->json(['error' => 'Hábito no encontrado'], 404);
        }
        $this->authorizeHabit($habit, $request);

        $today = Carbon::today()->startOfDay();
        $yesterday = Carbon::yesterday()->startOfDay();
        $isCompletedToday = $habit->last_completed_at 
                            && Carbon::parse($habit->last_completed_at)->startOfDay()->equalTo($today);

        if ($isCompletedToday) {
            $habit->last_completed_at = null;
            $habit->current_streak = 0; 
            $is_completed = false; 

        } else {
            
            $lastCompletionDate = $habit->last_completed_at ? Carbon::parse($habit->last_completed_at)->startOfDay() : null;
            if ($lastCompletionDate && $lastCompletionDate->equalTo($yesterday)) {
                $habit->current_streak++;
            } else if (!$lastCompletionDate || $lastCompletionDate->lessThan($yesterday)) {
                $habit->current_streak = 1;
            }
            
            $habit->last_completed_at = Carbon::now(); 
            $is_completed = true;
        }
        
        $habit->save();
        $habit->is_completed = $is_completed; 

        return response()->json($habit, 200);
    }
}