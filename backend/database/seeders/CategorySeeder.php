<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Автоматизация',
            'Анализ на данни',
            'Генериране на изображения',
            'Генериране на текст',
            'Дизайн и креативност',
            'Програмиране',
            'Чатоботове и асистенти',
        ];

        foreach ($categories as $categoryName) {
            Category::firstOrCreate(['name' => $categoryName]);
        }
    }
}
