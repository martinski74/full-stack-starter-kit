<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class ToolController extends Controller
{
    public function index()
    {
        return Tool::with(['categories', 'roles', 'user'])->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'documentation_url' => ['nullable', 'url'],
            'video_url' => ['nullable', 'url'],
            'difficulty' => ['nullable', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'category_ids' => ['array'],
            'category_ids.*' => ['integer'],
            'role_ids' => ['array'],
            'role_ids.*' => ['integer'],
            'status' => ['sometimes', 'string'],
        ]);

        $tool = Tool::create($validated + ['user_id' => $request->user()?->id]);
        if ($request->filled('category_ids')) {
            $tool->categories()->sync($validated['category_ids']);
        }
        if ($request->filled('role_ids')) {
            $tool->roles()->sync($validated['role_ids']);
        }

        return response()->json($tool->load(['categories', 'roles', 'user']), 201);
    }

    public function show(Tool $tool)
    {
        return $tool->load(['categories', 'roles', 'user']);
    }

    public function update(Request $request, Tool $tool)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'documentation_url' => ['nullable', 'url'],
            'video_url' => ['nullable', 'url'],
            'difficulty' => ['nullable', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'category_ids' => ['array'],
            'category_ids.*' => ['integer'],
            'role_ids' => ['array'],
            'role_ids.*' => ['integer'],
            'status' => ['sometimes', 'string'],
        ]);

        $tool->update($validated);
        if ($request->has('category_ids')) {
            $tool->categories()->sync($validated['category_ids'] ?? []);
        }
        if ($request->has('role_ids')) {
            $tool->roles()->sync($validated['role_ids'] ?? []);
        }

        return $tool->load(['categories', 'roles', 'user']);
    }

    public function updateStatus(Request $request, Tool $tool)
    {
        Log::info('updateStatus started for tool: ' . $tool->id);
        $startTime = microtime(true);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
        ]);
        Log::info('updateStatus validation completed in ' . (microtime(true) - $startTime) . ' seconds for tool: ' . $tool->id);

        $updateTime = microtime(true);
        $tool->update($validated);
        Log::info('updateStatus tool update completed in ' . (microtime(true) - $updateTime) . ' seconds for tool: ' . $tool->id);

        $loadTime = microtime(true);
        $loadedTool = $tool->load(['categories', 'roles', 'user']);
        Log::info('updateStatus tool load completed in ' . (microtime(true) - $loadTime) . ' seconds for tool: ' . $tool->id);

        Log::info('updateStatus finished in ' . (microtime(true) - $startTime) . ' seconds for tool: ' . $tool->id);
        return $loadedTool;
    }

    public function destroy(Tool $tool)
    {
        $tool->delete();
        return response()->noContent();
    }
}


