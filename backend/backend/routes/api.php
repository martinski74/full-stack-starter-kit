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

// Temporarily moved out of middleware for debugging
Route::apiResource('tools', ToolController::class);
Route::apiResource('categories', CategoryController::class);
Route::apiResource('roles', RoleController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Original protected CRUD for management (adjust policies later if needed)
    // Route::apiResource('tools', ToolController::class);
    // Route::apiResource('categories', CategoryController::class);
    // Route::apiResource('roles', RoleController::class);
});

