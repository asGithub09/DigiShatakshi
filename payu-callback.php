<?php
declare(strict_types=1);

require __DIR__ . '/payu-common.php';
payu_headers();

ini_set('display_errors', '0');
error_reporting(E_ALL);

function payu_callback_page(string $title, string $message, ?string $cancelUrl = null): void
{
    $content = '<h1>' . payu_h($title) . '</h1><p>' . payu_h($message) . '</p>';
    if ($cancelUrl !== null) {
        $content .= '<div class="notice"><strong>Self-service cancellation link</strong><p class="muted">Save this link or use the copy sent to your email.</p>'
            . '<a class="button" href="' . payu_h($cancelUrl) . '">Manage or cancel subscription</a></div>';
    }
    $content .= '<a class="back" href="/pricing">Return to Digi Shatakshi</a>';
    payu_html_page($title, $content);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    payu_callback_page('Unable to verify payment', 'Please return to the pricing page or contact hello@digishatakshi.com for assistance.');
    http_response_code(405);
    exit;
}

try {
    $config = payu_config();
    if (!payu_ready($config)) {
        payu_callback_page('Payment verification unavailable', 'Please contact hello@digishatakshi.com. Do not retry the payment until the status is confirmed.');
        http_response_code(503);
        exit;
    }

    $response = $_POST;
    $txnid = $response['txnid'] ?? '';
    if (!is_string($txnid) || !preg_match('/^[a-f0-9]{24}$/', $txnid)
        || !payu_verify_response_hash($response, $config['salt'], $config['key'])) {
        error_log('PayU callback failed transaction ID or response-hash validation.');
        payu_callback_page('Unable to verify payment', 'The payment response could not be verified. Please contact hello@digishatakshi.com before trying again.');
        http_response_code(400);
        exit;
    }

    $database = payu_database();
    $statement = $database->prepare('SELECT * FROM orders WHERE txnid = :txnid');
    $statement->execute([':txnid' => $txnid]);
    $order = $statement->fetch();
    if (!is_array($order)) {
        error_log('PayU callback referenced an unknown transaction.');
        payu_callback_page('Order not found', 'We could not match this payment to an order. Please contact hello@digishatakshi.com.');
        http_response_code(404);
        exit;
    }

    $plan = payu_plans()[$order['plan_id']] ?? null;
    $responseAmount = payu_amount_in_paise((string)($response['amount'] ?? ''));
    $expectedAmount = payu_amount_in_paise((string)$order['amount']);
    if ($plan === null || $responseAmount === null || $expectedAmount === null || $responseAmount !== $expectedAmount
        || (string)($response['productinfo'] ?? '') !== $plan['name']
        || strcasecmp((string)($response['email'] ?? ''), (string)$order['email']) !== 0) {
        error_log('PayU callback values did not match the stored order.');
        payu_callback_page('Payment details need review', 'The returned payment details did not match the order. Please contact hello@digishatakshi.com before making another payment.');
        http_response_code(400);
        exit;
    }

    $status = strtolower((string)($response['status'] ?? ''));
    if ($status !== 'success') {
        $update = $database->prepare(
            'UPDATE orders SET status = :status, updated_at = :updated_at WHERE txnid = :txnid AND status IN (\'pending\', \'verification_pending\')'
        );
        $update->execute([
            ':status' => 'failed',
            ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
            ':txnid' => $txnid,
        ]);
        payu_callback_page('Payment not completed', 'PayU did not complete the payment. If your account was debited, please contact hello@digishatakshi.com before retrying.');
        exit;
    }

    try {
        $verified = payu_verify_payment($config, $txnid);
    } catch (RuntimeException $error) {
        $update = $database->prepare(
            'UPDATE orders SET status = :status, updated_at = :updated_at WHERE txnid = :txnid AND status = \'pending\''
        );
        $update->execute([
            ':status' => 'verification_pending',
            ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
            ':txnid' => $txnid,
        ]);
        payu_callback_page('Payment verification in progress', 'PayU has returned a payment response and we are confirming it. Do not pay again; contact hello@digishatakshi.com if confirmation does not arrive shortly.');
        http_response_code(202);
        exit;
    }

    $verifiedStatus = strtolower((string)($verified['status'] ?? ''));
    $verifiedUnmapped = strtolower((string)($verified['unmappedstatus'] ?? ''));
    $verifiedAmount = is_array($verified)
        ? payu_amount_in_paise((string)($verified['amt'] ?? $verified['amount'] ?? $verified['transaction_amount'] ?? ''))
        : null;
    $verifiedPayuId = is_array($verified) ? (string)($verified['mihpayid'] ?? '') : '';
    $verifiedTxnid = is_array($verified) ? (string)($verified['txnid'] ?? $txnid) : '';
    $responsePayuId = (string)($response['mihpayid'] ?? '');
    if ($verified === null || $verifiedTxnid !== $txnid || $verifiedAmount !== $expectedAmount || $verifiedPayuId === ''
        || $responsePayuId === '' || !hash_equals($verifiedPayuId, $responsePayuId)
        || !in_array($verifiedStatus, ['success', 'captured'], true)
        || !in_array($verifiedUnmapped, ['captured', ''], true)) {
        if (in_array($verifiedStatus, ['failure', 'failed'], true) || in_array($verifiedUnmapped, ['failed', 'failure'], true)) {
            $update = $database->prepare(
                'UPDATE orders SET status = :status, updated_at = :updated_at WHERE txnid = :txnid AND status IN (\'pending\', \'verification_pending\')'
            );
            $update->execute([
                ':status' => 'failed',
                ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
                ':txnid' => $txnid,
            ]);
            payu_callback_page('Payment not completed', 'PayU could not confirm a successful payment. If your account was debited, contact hello@digishatakshi.com before retrying.');
            exit;
        }

        $update = $database->prepare(
            'UPDATE orders SET status = :status, updated_at = :updated_at WHERE txnid = :txnid AND status = \'pending\''
        );
        $update->execute([
            ':status' => 'verification_pending',
            ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
            ':txnid' => $txnid,
        ]);
        payu_callback_page('Payment verification in progress', 'PayU has not yet returned a final matching payment status. Do not pay again; contact hello@digishatakshi.com if confirmation does not arrive shortly.');
        http_response_code(202);
        exit;
    }

    $payuId = $verifiedPayuId;
    $paymentMode = (string)($verified['mode'] ?? $response['mode'] ?? $response['bankcode'] ?? 'unknown');
    $paymentSource = strtolower((string)($verified['payment_source'] ?? $response['payment_source'] ?? ''));
    $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM);
    $cancelUrl = null;
    $cancelToken = null;

    $database->beginTransaction();
    $lock = $database->prepare(
        'UPDATE orders SET status = :status, payu_id = :payu_id, payment_mode = :payment_mode, updated_at = :updated_at
         WHERE txnid = :txnid AND status IN (\'pending\', \'verification_pending\')'
    );

    if ($order['billing'] === 'once') {
        $lock->execute([
            ':status' => 'paid',
            ':payu_id' => $payuId,
            ':payment_mode' => $paymentMode,
            ':updated_at' => $now,
            ':txnid' => $txnid,
        ]);
        if ($lock->rowCount() !== 1) {
            $database->rollBack();
            payu_callback_page('Payment already recorded', 'This payment response has already been processed. Contact hello@digishatakshi.com if you need help.');
            exit;
        }
        $database->commit();
        $emailSent = payu_send_email(
            (string)$order['email'],
            'Payment received - Digi Shatakshi',
            "Hello {$order['customer_name']},\r\n\r\nWe received your one-time payment of ₹" . number_format((int)$plan['amount']) . " for {$plan['name']}.\r\n\r\nFor questions, contact hello@digishatakshi.com.\r\n"
        );
        if (!$emailSent) {
            error_log('PayU one-time payment confirmation email could not be accepted by mail().');
        }
        payu_callback_page('Payment successful', 'Your one-time payment for ' . $plan['name'] . ' was confirmed. A confirmation email ' . ($emailSent ? 'has been sent.' : 'could not be sent; please contact hello@digishatakshi.com.') . ' The Digi Shatakshi team will follow up.');
        exit;
    }

    if ($paymentSource !== 'sist') {
        $lock->execute([
            ':status' => 'paid_mandate_failed',
            ':payu_id' => $payuId,
            ':payment_mode' => $paymentMode,
            ':updated_at' => $now,
            ':txnid' => $txnid,
        ]);
        if ($lock->rowCount() !== 1) {
            $database->rollBack();
            payu_callback_page('Payment already recorded', 'This payment response has already been processed. Contact hello@digishatakshi.com if you need help.');
            exit;
        }
        $database->commit();
        $emailSent = payu_send_email(
            (string)$order['email'],
            'Payment received - subscription needs attention',
            "Hello {$order['customer_name']},\r\n\r\nYour payment for {$plan['name']} was received, but PayU did not confirm the recurring mandate. Please contact hello@digishatakshi.com before making another payment.\r\n"
        );
        if (!$emailSent) {
            error_log('PayU mandate-failure email could not be accepted by mail().');
        }
        payu_callback_page('Payment received; mandate not confirmed', 'Your first payment was received, but PayU did not confirm the monthly mandate. We will not start recurring charges. ' . ($emailSent ? 'We emailed you with next steps.' : 'Please contact hello@digishatakshi.com before making another payment.'));
        exit;
    }

    $cancelToken = bin2hex(random_bytes(32));
    $cancelTokenHash = payu_cancel_token_hash($cancelToken);
    $startDate = (string)($order['payment_start_date'] ?? '');
    $endDate = (string)($order['payment_end_date'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
        $database->rollBack();
        throw new RuntimeException('The stored subscription dates are invalid.');
    }
    $billingDay = (int)(new DateTimeImmutable($startDate, new DateTimeZone('Asia/Kolkata')))->format('j');
    $nextDueDate = payu_next_month_date($startDate, $billingDay);

    $lock->execute([
        ':status' => 'active',
        ':payu_id' => $payuId,
        ':payment_mode' => $paymentMode,
        ':updated_at' => $now,
        ':txnid' => $txnid,
    ]);
    if ($lock->rowCount() !== 1) {
        $database->rollBack();
        payu_callback_page('Payment already recorded', 'This payment response has already been processed. Check your email for the subscription cancellation link or contact hello@digishatakshi.com.');
        exit;
    }

    $insert = $database->prepare(
        'INSERT INTO subscriptions (
            txnid, plan_id, amount, customer_name, email, phone, auth_payu_id, payment_mode,
            status, next_due_date, billing_day, payment_end_date, next_seq, cancel_token_hash, created_at, updated_at
        ) VALUES (
            :txnid, :plan_id, :amount, :customer_name, :email, :phone, :auth_payu_id, :payment_mode,
            :status, :next_due_date, :billing_day, :payment_end_date, :next_seq, :cancel_token_hash, :created_at, :updated_at
        )'
    );
    $insert->execute([
        ':txnid' => $txnid,
        ':plan_id' => $order['plan_id'],
        ':amount' => $order['amount'],
        ':customer_name' => $order['customer_name'],
        ':email' => $order['email'],
        ':phone' => $order['phone'],
        ':auth_payu_id' => $payuId,
        ':payment_mode' => $paymentMode,
        ':status' => 'active',
        ':next_due_date' => $nextDueDate,
        ':billing_day' => $billingDay,
        ':payment_end_date' => $endDate,
        ':next_seq' => 2,
        ':cancel_token_hash' => $cancelTokenHash,
        ':created_at' => $now,
        ':updated_at' => $now,
    ]);
    $database->commit();

    $cancelUrl = $config['public_url'] . '/payu-cancel.php#' . $cancelToken;
    $emailSent = payu_send_email(
        (string)$order['email'],
        'Subscription started - Digi Shatakshi',
        "Hello {$order['customer_name']},\r\n\r\nYour monthly {$plan['name']} subscription is active. The first payment of ₹" . number_format((int)$plan['amount']) . " was received. Future payments are monthly until you cancel.\r\n\r\nSelf-service cancellation: {$cancelUrl}\r\n\r\nFor questions, contact hello@digishatakshi.com.\r\n"
    );
    if (!$emailSent) {
        error_log('PayU subscription confirmation email could not be accepted by mail().');
    }

    payu_callback_page(
        'Subscription active',
        'Your first payment for ' . $plan['name'] . ' was confirmed. Monthly billing is active until you cancel. ' . ($emailSent ? 'A confirmation and cancellation link were emailed to you.' : 'The confirmation email could not be sent; save the cancellation link below and contact hello@digishatakshi.com.'),
        $cancelUrl
    );
} catch (PDOException | RuntimeException | JsonException $error) {
    error_log('PayU callback processing failed: ' . get_class($error));
    payu_callback_page('Payment confirmation pending', 'We could not finish processing the payment response. Do not retry the payment; please contact hello@digishatakshi.com.');
    http_response_code(503);
}
