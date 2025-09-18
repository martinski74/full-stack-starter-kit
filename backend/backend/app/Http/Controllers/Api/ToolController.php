<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

    public function destroy(Tool $tool)
    {
        $tool->delete();
        return response()->noContent();
    }
}


