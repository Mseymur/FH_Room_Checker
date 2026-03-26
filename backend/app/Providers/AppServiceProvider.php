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
        // Strict limit for the initialize endpoint — triggers an external university API call
        RateLimiter::for('initialize', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Standard limit for read-only room endpoints
        // Rate limit public room reads by the forwarded client identity instead of the proxy host.
        RateLimiter::for('rooms', function (Request $request) {
            $clientIp = $request->header('X-Client-IP');
            $userAgent = substr((string) $request->userAgent(), 0, 120);
            $rateLimitKey = $clientIp ?: $request->ip();

            return Limit::perMinute(45)->by($rateLimitKey.'|'.$userAgent);
        });
    }
}
