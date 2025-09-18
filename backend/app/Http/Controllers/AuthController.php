<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail; // Added for 2FA
use App\Mail\TwoFactorCodeMail; // Added for 2FA
use Illuminate\Support\Str; // Added for 2FA code generation

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $startTime = microtime(true);
        Log::info('Login process started.');

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $validationTime = microtime(true);
        Log::info('Login validation complete. Time taken: ' . round($validationTime - $startTime, 4) . ' seconds.');

        // Find the user by email
        $user = User::where('email', $request->email)->first();

        if ($user && Hash::check($request->password, $user->password)) {
            // If user exists and password matches

            // Generate a 2FA code
            $twoFactorCode = random_int(100000, 999999); // Changed to generate a 6-digit numeric code
            $user->two_factor_secret = encrypt($twoFactorCode);
            $user->two_factor_confirmed_at = now()->addMinutes(10); // Code expires in 10 minutes
            $user->save();

            // Send the 2FA code via email
            Mail::to($user->email)->send(new TwoFactorCodeMail($twoFactorCode));

            Log::info('2FA code sent to user: ' . $user->email);

            return response()->json([
                'message' => 'Two-factor authentication required',
                'user_id' => $user->id,
                'email' => $user->email,
            ], 202); // 202 Accepted indicates that 2FA is needed

        } else {
            $failedAttemptTime = microtime(true);
            Log::warning('Auth::attempt failed. Time taken: ' . round($failedAttemptTime - $validationTime, 4) . ' seconds.');
            Log::info('Login process completed with failure. Total time: ' . round($failedAttemptTime - $startTime, 4) . ' seconds.');

            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }
    }

    public function verifyTwoFactor(Request $request)
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'two_factor_code' => ['required', 'string', 'size:6'],
        ]);

        $user = User::find($request->user_id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Check if 2FA code is present and not expired
        if (empty($user->two_factor_secret) || is_null($user->two_factor_confirmed_at) || now()->gt($user->two_factor_confirmed_at)) {
            return response()->json(['message' => 'Two-factor authentication code expired or not set.'], 400);
        }

        // Decrypt and verify the 2FA code
        if (hash_equals((string) decrypt($user->two_factor_secret), $request->two_factor_code)) {
            Auth::login($user); // Log in the user

            $token = $user->createToken('auth_token')->plainTextToken;

            // Clear 2FA secret and expiration time after successful verification
            $user->forceFill([
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
            ])->save();

            Log::info('User authenticated successfully via 2FA: ' . $user->email);

            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'token' => $token,
            ]);
        } else {
            Log::warning('Invalid 2FA code provided for user: ' . $user->email);
            return response()->json(['message' => 'Invalid two-factor authentication code.'], 401);
        }
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['nullable', 'string', 'exists:roles,name'], // Validate if role exists in roles table
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'user', // Default role to 'user' if not provided
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user,
            'token' => $token,
        ], 201);
    }
}

