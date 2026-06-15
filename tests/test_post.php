<?php
$url = 'http://localhost/Koperasi_combine_29_4_26/public/contact';
$data = ['name' => 'Test', 'email' => 'test@example.com', 'message' => 'Test msg'];
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\nAccept: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true,
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo "Status: " . $http_response_header[0] . "\n";
echo "Response: " . $result . "\n";
