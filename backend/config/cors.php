<?php

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'OPTIONS'],

    'allowed_origins' => [
        env('FRONTEND_ORIGIN', 'http://localhost:8100'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-Requested-With'],

    'exposed_headers' => ['X-RateLimit-Remaining'],

    'max_age' => 0,

    'supports_credentials' => false,

];
