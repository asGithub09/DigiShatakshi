<?php
declare(strict_types=1);

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

date_default_timezone_set('Asia/Kolkata');

function payu_headers(): void
{
    header('Cache-Control: no-store, private');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
}

function payu_config(): ?array
{
    $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'payu-config.php';
    if (!is_file($path)) {
        return null;
    }

    $config = require $path;
    if (!is_array($config)) {
        throw new RuntimeException('The private PayU configuration must return an array.');
    }

    $key = $config['key'] ?? '';
    $salt = $config['salt'] ?? '';
    $mode = $config['mode'] ?? '';
    if (!is_string($key) || !is_string($salt) || !in_array($mode, ['test', 'production'], true)) {
        throw new RuntimeException('The private PayU configuration is incomplete.');
    }

    $config['key'] = trim($key);
    $config['salt'] = trim($salt);
    $config['mode'] = $mode;
    $config['enable_checkout'] = ($config['enable_checkout'] ?? false) === true;
    $config['enable_recurring_processing'] = ($config['enable_recurring_processing'] ?? false) === true;
    $config['public_url'] = rtrim((string)($config['public_url'] ?? 'https://digishatakshi.com'), '/');

    return $config;
}

function payu_ready(?array $config): bool
{
    return $config !== null
        && $config['enable_checkout'] === true
        && $config['key'] !== ''
        && $config['salt'] !== '';
}

function payu_plans(): array
{
    return [
        'website-landing' => ['name' => 'Landing Page', 'category' => 'Website', 'amount' => 25000, 'billing' => 'once'],
        'website-business' => ['name' => 'Business Website', 'category' => 'Website', 'amount' => 35000, 'billing' => 'once'],
        'website-ecommerce' => ['name' => 'E-Commerce Website', 'category' => 'Website', 'amount' => 45000, 'billing' => 'once'],
        'smm-basic' => ['name' => 'Basic SMM', 'category' => 'Social Media Marketing', 'amount' => 25000, 'billing' => 'monthly'],
        'smm-moderate' => ['name' => 'Moderate SMM', 'category' => 'Social Media Marketing', 'amount' => 35000, 'billing' => 'monthly'],
        'smm-advanced' => ['name' => 'Premium SMM', 'category' => 'Social Media Marketing', 'amount' => 45000, 'billing' => 'monthly'],
        'seo-local' => ['name' => 'Local SEO', 'category' => 'SEO & Search Ranking', 'amount' => 9999, 'billing' => 'monthly'],
        'seo-growth' => ['name' => 'Growth SEO', 'category' => 'SEO & Search Ranking', 'amount' => 19999, 'billing' => 'monthly'],
        'seo-advanced' => ['name' => 'Advanced SEO', 'category' => 'SEO & Search Ranking', 'amount' => 34999, 'billing' => 'monthly'],
        'ads-meta' => ['name' => 'Meta Ads Starter', 'category' => 'Paid Ads & Lead Gen', 'amount' => 9999, 'billing' => 'monthly'],
        'ads-google' => ['name' => 'Google Ads Growth', 'category' => 'Paid Ads & Lead Gen', 'amount' => 14999, 'billing' => 'monthly'],
        'ads-multichannel' => ['name' => 'Multi-Channel Performance', 'category' => 'Paid Ads & Lead Gen', 'amount' => 27500, 'billing' => 'monthly'],
    ];
}

function payu_h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function payu_amount(int $amount): string
{
    return number_format($amount, 2, '.', '');
}

function payu_amount_in_paise(string $amount): ?int
{
    if (!preg_match('/^\d+(?:\.\d{1,2})?$/', $amount)) {
        return null;
    }

    [$rupees, $paise] = array_pad(explode('.', $amount, 2), 2, '0');
    return ((int)$rupees * 100) + (int)str_pad($paise, 2, '0');
}

function payu_private_directory(): string
{
    return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'payu-private';
}

function payu_database(): PDO
{
    $directory = payu_private_directory();
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('The private payment storage directory could not be created.');
    }
    if (!chmod($directory, 0700)) {
        throw new RuntimeException('Private payment storage permissions could not be secured.');
    }

    $path = $directory . DIRECTORY_SEPARATOR . 'payments.sqlite';
    $database = new PDO('sqlite:' . $path, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $database->exec('PRAGMA foreign_keys = ON');
    $database->exec('PRAGMA busy_timeout = 5000');
    $database->exec(
        'CREATE TABLE IF NOT EXISTS orders (
            txnid TEXT PRIMARY KEY,
            plan_id TEXT NOT NULL,
            amount TEXT NOT NULL,
            billing TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            payment_start_date TEXT,
            payment_end_date TEXT,
            status TEXT NOT NULL,
            payu_id TEXT,
            payment_mode TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );
    $database->exec(
        'CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            txnid TEXT NOT NULL UNIQUE REFERENCES orders(txnid),
            plan_id TEXT NOT NULL,
            amount TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            auth_payu_id TEXT NOT NULL UNIQUE,
            payment_mode TEXT NOT NULL,
            status TEXT NOT NULL,
            next_due_date TEXT NOT NULL,
            billing_day INTEGER NOT NULL,
            payment_end_date TEXT NOT NULL,
            next_seq INTEGER NOT NULL DEFAULT 2,
            cancel_token_hash TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );
    $database->exec(
        'CREATE TABLE IF NOT EXISTS charges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
            due_date TEXT NOT NULL,
            txnid TEXT NOT NULL UNIQUE,
            invoice_number TEXT NOT NULL UNIQUE,
            mandate_seq_no INTEGER,
            status TEXT NOT NULL DEFAULT \'scheduled\',
            predebit_status TEXT,
            predebit_invoice_id TEXT,
            predebit_approval_status TEXT,
            payu_id TEXT,
            attempted_at TEXT,
            last_checked_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(subscription_id, due_date)
        )'
    );
    if (!chmod($path, 0600)) {
        throw new RuntimeException('The payment database permissions could not be secured.');
    }

    return $database;
}

function payu_payment_url(array $config): string
{
    return $config['mode'] === 'test'
        ? 'https://test.payu.in/_payment'
        : 'https://secure.payu.in/_payment';
}

function payu_postservice_url(array $config): string
{
    return $config['mode'] === 'test'
        ? 'https://test.payu.in/merchant/postservice.php?form=2'
        : 'https://info.payu.in/merchant/postservice.php?form=2';
}

function payu_api(array $config, string $command, string $var1): array
{
    $payload = [
        'key' => $config['key'],
        'command' => $command,
        'var1' => $var1,
        'hash' => hash('sha512', $config['key'] . '|' . $command . '|' . $var1 . '|' . $config['salt']),
    ];
    $curl = curl_init(payu_postservice_url($config));
    if ($curl === false) {
        throw new RuntimeException('PayU could not be reached.');
    }

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'],
        CURLOPT_POSTFIELDS => http_build_query($payload, '', '&', PHP_QUERY_RFC3986),
    ]);
    $body = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($body === false || $status < 200 || $status >= 300) {
        error_log('PayU API request failed with HTTP status ' . $status . '.');
        throw new RuntimeException('PayU could not confirm the request. Please try again later.');
    }

    $result = json_decode($body, true);
    if (!is_array($result)) {
        error_log('PayU returned an unreadable API response' . ($curlError !== '' ? ': ' . $curlError : '.') );
        throw new RuntimeException('PayU returned an unreadable response.');
    }

    return $result;
}

function payu_verify_payment(array $config, string $txnid): ?array
{
    $result = payu_api($config, 'verify_payment', $txnid);
    $detail = $result['transaction_details'][$txnid] ?? null;
    return is_array($detail) ? $detail : null;
}

function payu_verify_response_hash(array $response, string $salt, string $key): bool
{
    $status = (string)($response['status'] ?? '');
    $returnedHash = strtolower((string)($response['hash'] ?? ''));
    if ($status === '' || $returnedHash === '' || !hash_equals($key, (string)($response['key'] ?? ''))) {
        return false;
    }

    $hashString = $salt . '|' . $status . '||||||'
        . (string)($response['udf5'] ?? '') . '|'
        . (string)($response['udf4'] ?? '') . '|'
        . (string)($response['udf3'] ?? '') . '|'
        . (string)($response['udf2'] ?? '') . '|'
        . (string)($response['udf1'] ?? '') . '|'
        . (string)($response['email'] ?? '') . '|'
        . (string)($response['firstname'] ?? '') . '|'
        . (string)($response['productinfo'] ?? '') . '|'
        . (string)($response['amount'] ?? '') . '|'
        . (string)($response['txnid'] ?? '') . '|'
        . $key;

    $additionalCharges = (string)($response['additional_charges'] ?? $response['additionalCharges'] ?? '');
    if ($additionalCharges !== '') {
        $hashString = $additionalCharges . '|' . $hashString;
    }

    return hash_equals(hash('sha512', $hashString), $returnedHash);
}

function payu_date_today(): string
{
    return (new DateTimeImmutable('today', new DateTimeZone('Asia/Kolkata')))->format('Y-m-d');
}

function payu_next_month_date(string $fromDate, int $billingDay): string
{
    $date = new DateTimeImmutable($fromDate, new DateTimeZone('Asia/Kolkata'));
    $nextMonth = $date->modify('first day of next month');
    $day = min($billingDay, (int)$nextMonth->format('t'));
    return $nextMonth->setDate((int)$nextMonth->format('Y'), (int)$nextMonth->format('m'), $day)->format('Y-m-d');
}

function payu_cancel_token_hash(string $token): string
{
    return hash('sha256', $token);
}

function payu_send_email(string $to, string $subject, string $message): bool
{
    $headers = [
        'From: Digi Shatakshi <hello@digishatakshi.com>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ];

    return mail($to, $subject, $message, implode("\r\n", $headers));
}

function payu_html_page(string $title, string $content, ?string $script = null): void
{
    $nonce = base64_encode(random_bytes(18));
    header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-{$nonce}'; connect-src 'self'; form-action 'self' https://test.payu.in https://secure.payu.in; base-uri 'none'; frame-ancestors 'none'");
    header('Content-Type: text/html; charset=utf-8');

    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="referrer" content="no-referrer"><title>' . payu_h($title) . ' | Digi Shatakshi</title>'
        . '<style>
            :root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
            *{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 50% 0,#26375a 0,#111a2c 46%,#0b1020 100%);color:#e8edf7;display:grid;place-items:center;padding:24px}
            main{width:min(100%,560px);padding:clamp(24px,5vw,40px);border:1px solid rgba(148,163,184,.24);border-radius:24px;background:rgba(20,30,49,.92);box-shadow:0 24px 80px rgba(0,0,0,.4)}
            .brand{color:#a5b4fc;font-size:.78rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}h1{font-size:clamp(1.7rem,5vw,2.25rem);line-height:1.15;margin:12px 0;color:#f8fafc}p{color:#c6d0e0;line-height:1.65}label{display:block;color:#e5eaf3;font-size:.9rem;font-weight:650;margin:16px 0 7px}
            input{width:100%;padding:13px 14px;border:1px solid #475569;border-radius:12px;background:#0f172a;color:#f8fafc;font:inherit}input:focus{outline:2px solid #818cf8;outline-offset:2px}
            .check{display:flex;align-items:flex-start;gap:10px;margin:18px 0}.check input{width:18px;height:18px;margin:2px 0;flex:none;accent-color:#818cf8}.check label{margin:0;font-weight:500;line-height:1.5}
            button,.button{display:inline-flex;justify-content:center;align-items:center;width:100%;border:0;border-radius:12px;padding:14px 18px;background:linear-gradient(100deg,#7c3aed,#4f46e5);color:white;font:inherit;font-weight:800;text-decoration:none;cursor:pointer}
            button:disabled{opacity:.6;cursor:wait}.muted{font-size:.84rem;color:#9aa8bd}.notice{padding:14px 16px;border:1px solid rgba(129,140,248,.35);border-radius:14px;background:rgba(79,70,229,.12);color:#dbe4ff}.summary{display:flex;justify-content:space-between;gap:20px;padding:15px 0;border-bottom:1px solid rgba(148,163,184,.18)}.summary strong{color:#fff}.back{display:inline-block;margin-top:18px;color:#c7d2fe}
        </style></head><body><main><div class="brand">Digi Shatakshi</div>' . $content
        . ($script !== null ? '<script nonce="' . $nonce . '">' . $script . '</script>' : '')
        . '</main></body></html>';
}

function payu_json_response(int $status, array $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
