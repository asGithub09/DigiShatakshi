<?php
declare(strict_types=1);

require __DIR__ . '/payu-common.php';
payu_headers();

ini_set('display_errors', '0');
error_reporting(E_ALL);
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

function payu_checkout_page(string $title, string $message, int $status = 200): void
{
    http_response_code($status);
    payu_html_page($title, '<h1>' . payu_h($title) . '</h1><p>' . payu_h($message) . '</p><a class="back" href="/pricing">Return to pricing</a>');
}

try {
    $config = payu_config();
} catch (RuntimeException $error) {
    error_log('PayU checkout configuration is invalid.');
    payu_checkout_page('Checkout unavailable', 'Online payments are temporarily unavailable. Please contact hello@digishatakshi.com or continue through WhatsApp.', 503);
    exit;
}

if (!payu_ready($config)) {
    payu_checkout_page('Checkout not available yet', 'Online payments are being configured. Please contact hello@digishatakshi.com or book through WhatsApp.', 503);
    exit;
}

$plans = payu_plans();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$planId = $method === 'POST' ? ($_POST['plan'] ?? '') : ($_GET['plan'] ?? '');
$plan = is_string($planId) ? ($plans[$planId] ?? null) : null;
if ($plan === null) {
    payu_checkout_page('Package not found', 'Choose a package from the pricing page to continue.', 404);
    exit;
}

if (empty($_SESSION['payu_csrf'])) {
    $_SESSION['payu_csrf'] = bin2hex(random_bytes(32));
}

if ($method === 'POST') {
    $csrf = $_POST['csrf'] ?? '';
    if (!is_string($csrf) || !hash_equals((string)$_SESSION['payu_csrf'], $csrf)) {
        payu_checkout_page('Session expired', 'Please return to pricing and start checkout again.', 403);
        exit;
    }

    if (!empty($_POST['website'])) {
        payu_checkout_page('Unable to continue', 'Please return to pricing and try again.', 400);
        exit;
    }

    $name = trim((string)($_POST['name'] ?? ''));
    $email = trim((string)($_POST['email'] ?? ''));
    $phone = trim((string)($_POST['phone'] ?? ''));
    $accepted = ($_POST['accept'] ?? '') === 'yes';
    if ($name === '' || strlen($name) > 60 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 50
        || !preg_match('/^\+?[0-9][0-9 ()-]{6,18}$/', $phone) || !$accepted) {
        http_response_code(422);
        $errorMessage = 'Please provide a name, valid email, phone number, and accept the payment terms.';
    } else {
        try {
            $amount = payu_amount((int)$plan['amount']);
            $txnid = bin2hex(random_bytes(12));
            $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM);
            $paymentStartDate = $plan['billing'] === 'monthly' ? payu_date_today() : null;
            $paymentEndDate = $paymentStartDate !== null
                ? (new DateTimeImmutable($paymentStartDate, new DateTimeZone('Asia/Kolkata')))->modify('+30 years')->format('Y-m-d')
                : null;
            $database = payu_database();
            $statement = $database->prepare(
                'INSERT INTO orders (
                    txnid, plan_id, amount, billing, customer_name, email, phone,
                    payment_start_date, payment_end_date, status, created_at, updated_at
                 ) VALUES (
                    :txnid, :plan_id, :amount, :billing, :customer_name, :email, :phone,
                    :payment_start_date, :payment_end_date, :status, :created_at, :updated_at
                 )'
            );
            $statement->execute([
                ':txnid' => $txnid,
                ':plan_id' => $planId,
                ':amount' => $amount,
                ':billing' => $plan['billing'],
                ':customer_name' => $name,
                ':email' => $email,
                ':phone' => $phone,
                ':payment_start_date' => $paymentStartDate,
                ':payment_end_date' => $paymentEndDate,
                ':status' => 'pending',
                ':created_at' => $now,
                ':updated_at' => $now,
            ]);

            $nameParts = preg_split('/\s+/u', $name);
            $firstName = is_array($nameParts) ? $nameParts[0] : $name;
            $productInfo = $plan['name'];
            $callback = $config['public_url'] . '/payu-callback.php';
            $parameters = [
                'key' => $config['key'],
                'txnid' => $txnid,
                'amount' => $amount,
                'productinfo' => $productInfo,
                'firstname' => $firstName,
                'email' => $email,
                'phone' => $phone,
                'surl' => $callback,
                'furl' => $callback,
            ];

            $hashInput = $parameters['key'] . '|' . $txnid . '|' . $amount . '|' . $productInfo . '|'
                . $firstName . '|' . $email . str_repeat('|', 11);

            if ($plan['billing'] === 'monthly') {
                $siDetails = json_encode([
                    'billingAmount' => $amount,
                    'billingCurrency' => 'INR',
                    'billingCycle' => 'MONTHLY',
                    'billingInterval' => 1,
                    'paymentStartDate' => $paymentStartDate,
                    'paymentEndDate' => $paymentEndDate,
                ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

                $parameters['api_version'] = '7';
                $parameters['si'] = '4';
                $parameters['si_details'] = $siDetails;
                $hashInput .= $siDetails . '|';
            }

            $parameters['hash'] = hash('sha512', $hashInput . $config['salt']);
            $action = payu_payment_url($config);
            $hiddenFields = '';
            foreach ($parameters as $key => $value) {
                $hiddenFields .= '<input type="hidden" name="' . payu_h($key) . '" value="' . payu_h((string)$value) . '">';
            }
            $content = '<h1>Continue to PayU</h1>'
                . '<p>Review the amount and complete your payment securely on PayU.</p>'
                . '<div class="summary"><span>' . payu_h($plan['name']) . '</span><strong>₹' . number_format((int)$plan['amount']) . '</strong></div>'
                . '<p class="muted">' . ($plan['billing'] === 'monthly' ? 'Monthly recurring payment. Your first payment is collected now; you can cancel anytime using the link sent to your email.' : 'One-time payment.') . '</p>'
                . '<form id="payu-form" method="post" action="' . payu_h($action) . '">' . $hiddenFields
                . '<button type="submit">Continue to PayU</button></form>';
            $script = "document.getElementById('payu-form').submit();";
            payu_html_page('Continue to PayU', $content, $script);
            exit;
        } catch (PDOException | RuntimeException | JsonException $error) {
            error_log('PayU checkout could not create an order: ' . get_class($error));
            payu_checkout_page('Checkout unavailable', 'We could not prepare this payment. Please try again later or contact hello@digishatakshi.com.', 503);
            exit;
        }
    }
} elseif ($method !== 'GET') {
    header('Allow: GET, POST');
    payu_checkout_page('Method not allowed', 'Please open checkout from the pricing page.', 405);
    exit;
}

$csrf = payu_h((string)$_SESSION['payu_csrf']);
$price = number_format((int)$plan['amount']);
$monthly = $plan['billing'] === 'monthly';
$terms = $monthly
    ? 'I authorize a charge of ₹' . $price . ' once per month until I cancel. I can cancel using the self-service link sent to my email. The first monthly payment is collected now.'
    : 'I agree to a one-time charge of ₹' . $price . ' for this package.';
$content = '<h1>Secure checkout</h1>'
    . '<p>Confirm your package and contact details. Payments are processed by PayU.</p>'
    . '<div class="summary"><span>' . payu_h($plan['name']) . '</span><strong>₹' . $price . ($monthly ? ' / month' : '') . '</strong></div>'
    . (isset($errorMessage) ? '<p class="notice">' . payu_h($errorMessage) . '</p>' : '')
    . '<form method="post" action="/payu-checkout.php?plan=' . rawurlencode($planId) . '">'
    . '<input type="hidden" name="plan" value="' . payu_h($planId) . '">'
    . '<input type="hidden" name="csrf" value="' . $csrf . '">'
    . '<div style="position:absolute;left:-10000px" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>'
    . '<label for="name">Full name</label><input id="name" name="name" autocomplete="name" maxlength="60" required value="' . payu_h((string)($_POST['name'] ?? '')) . '">'
    . '<label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="email" maxlength="50" required value="' . payu_h((string)($_POST['email'] ?? '')) . '">'
    . '<label for="phone">Phone number</label><input id="phone" name="phone" type="tel" autocomplete="tel" maxlength="20" required value="' . payu_h((string)($_POST['phone'] ?? '')) . '">'
    . '<div class="check"><input id="accept" name="accept" type="checkbox" value="yes" required><label for="accept">' . payu_h($terms) . ' Payment details are used to process and manage your package.</label></div>'
    . '<button type="submit">Continue securely</button></form>'
    . '<p class="muted">The amount charged is the listed package price. PayU may show the payment methods available for your account.</p>'
    . '<a class="back" href="/pricing">Back to pricing</a>';
payu_html_page('Secure checkout', $content);
