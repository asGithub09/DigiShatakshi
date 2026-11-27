<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, bool $success, string $message): void
{
    http_response_code($status);
    echo json_encode(
        ['success' => $success, 'message' => $message],
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function readField(array $input, string $key, int $maxBytes): string
{
    $value = $input[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }

    $value = trim(str_replace(["\r", "\n", "\t"], ' ', $value));
    if (strlen($value) > $maxBytes) {
        return '';
    }

    return $value;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Use POST to submit an enquiry.');
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false) {
    respond(400, false, 'The enquiry could not be read. Please try again.');
}
if (strlen($rawBody) > 16000) {
    respond(413, false, 'The submitted enquiry is too large.');
}

$input = json_decode($rawBody, true);
if (!is_array($input)) {
    respond(400, false, 'The enquiry could not be read. Please try again.');
}

$formTypes = [
    'modal-status' => 'Consultation request',
    'home-form-status' => 'Home page enquiry',
    'contact-page-status' => 'Contact page enquiry',
];
$formType = readField($input, 'formType', 40);
if (!isset($formTypes[$formType])) {
    respond(400, false, 'The enquiry form is not recognized.');
}

$name = readField($input, 'name', 200);
$business = readField($input, 'business', 200);
$email = readField($input, 'email', 254);
$phone = readField($input, 'phone', 50);
$service = readField($input, 'service', 200);

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $phone === '') {
    respond(422, false, 'Please provide your name, a valid email address, and phone number.');
}

$lines = [
    'New enquiry from digishatakshi.com',
    'Form: ' . $formTypes[$formType],
    'Name: ' . $name,
    'Business: ' . ($business !== '' ? $business : 'Not provided'),
    'Email: ' . $email,
    'Phone: ' . $phone,
    'Service: ' . ($service !== '' ? $service : 'Not specified'),
    'Received: ' . gmdate(DATE_ATOM),
];

$headers = [
    'From: Digi Shatakshi Website <hello@digishatakshi.com>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = mail(
    'hello@digishatakshi.com',
    'New website enquiry - ' . $formTypes[$formType],
    implode("\r\n", $lines),
    implode("\r\n", $headers)
);

if (!$sent) {
    error_log('Digi Shatakshi enquiry email could not be accepted by mail().');
    respond(502, false, 'The email service could not accept your enquiry. Please try again or email us directly.');
}

respond(200, true, 'Your enquiry has been received.');
