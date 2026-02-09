<?php

return [
    'api_url' => env('FHJ_API_URL', 'https://cis.fh-joanneum.at/img/zimmer_plan.php'),
    
    'default_building' => env('DEFAULT_BUILDING', 'AP152'),
    
    'opening_hours_start' => env('OPENING_HOURS_START', '00:00'),
    'opening_hours_end'   => env('OPENING_HOURS_END', '23:59:59'),

    'min_free_minutes'    => env('MIN_FREE_MINUTES', 15),

    'http_timeout' => env('FHJ_HTTP_TIMEOUT', 8),

    'buildings' => [
        'AP152', 
        'AP147', 
        'AP149', 
        'AP154', 
        'EA11', 
        'EA9', 
        'EA13', 
        'ES30i', 
        'ES7a', 
        'ES7b'
    ],
];
