<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BuildingInitializeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $allowed = array_map('strtoupper', config('room_checker.buildings', []));

        return [
            'buildingCode' => [
                'required',
                'string',
                'max:10',
                'regex:/^[A-Za-z0-9]+$/',
                Rule::in($allowed),
            ],
        ];
    }
}
