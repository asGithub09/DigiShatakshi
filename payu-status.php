<?php
declare(strict_types=1);

require __DIR__ . '/payu-common.php';
payu_headers();
ini_set('display_errors', '0');
error_reporting(E_ALL);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    payu_json_response(405, ['enabled' => false]);
}

try {
    $config = payu_config();
    payu_json_response(200, ['enabled' => payu_ready($config) && $config['mode'] === 'production']);
} catch (RuntimeException $error) {
    error_log('PayU configuration is invalid.');
    payu_json_response(200, ['enabled' => false]);
}
