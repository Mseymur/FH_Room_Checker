<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoomQueryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => ['nullable', 'date_format:Y-m-d'],
            'time' => ['nullable', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
        ];
    }
}

