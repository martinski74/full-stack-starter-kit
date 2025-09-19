<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ToolController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-2fa', [AuthController::class, 'verifyTwoFactor']); // Added for 2FA verification

Route::get('/tools', [ToolController::class, 'index']);
Route::get('/tools/{tool}', [ToolController::class, 'show']);
Route::put('/tools/{tool}/status', [ToolController::class, 'updateStatus']);

Route::apiResource('categories', CategoryController::class);
Route::apiResource('roles', RoleController::class);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/tools', [ToolController::class, 'store']);
    Route::put('/tools/{tool}', [ToolController::class, 'update']);
    Route::delete('/tools/{tool}', [ToolController::class, 'destroy']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Original protected CRUD for management (adjust policies later if needed)
    // Route::apiResource('tools', ToolController::class);
    // Route::apiResource('categories', CategoryController::class);
    // Route::apiResource('roles', RoleController::class);
});

