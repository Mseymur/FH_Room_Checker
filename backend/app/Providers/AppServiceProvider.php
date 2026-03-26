<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Standard limit for public read-only room endpoints
        RateLimiter::for('rooms', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });
    }
}
