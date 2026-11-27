<?php
declare(strict_types=1);

require __DIR__ . '/payu-common.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

ini_set('display_errors', '0');
error_reporting(E_ALL);

function payu_cron_log(string $message): void
{
    fwrite(STDOUT, '[' . gmdate('Y-m-d\TH:i:s\Z') . '] ' . $message . PHP_EOL);
}

function payu_cron_mandate_kind(string $mode): string
{
    $mode = strtoupper(trim($mode));
    if (str_contains($mode, 'UPI')) {
        return 'upi';
    }
    if (in_array($mode, ['CC', 'DC', 'CARD', 'VISA', 'MAST', 'RUPAY', 'AMEX'], true)) {
        return 'card';
    }
    return 'bank';
}

function payu_cron_request_id(array $charge, string $suffix): string
{
    return (string)$charge['invoice_number'] . '_' . $suffix;
}

function payu_cron_mandate_status(array $config, array $subscription, string $kind): string
{
    $command = $kind === 'upi'
        ? 'upi_mandate_status'
        : ($kind === 'bank' ? 'NB_mandate_status' : 'check_mandate_status');
    $idField = $kind === 'bank' ? 'authpayuid' : 'authPayuId';
    $var1 = json_encode([
        $idField => (string)$subscription['auth_payu_id'],
        'requestId' => bin2hex(random_bytes(12)),
    ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $result = payu_api($config, $command, $var1);

    return strtolower((string)($result['status'] ?? ''));
}

function payu_cron_update_charge(PDO $database, int $chargeId, array $values): void
{
    $statement = $database->prepare(
        'UPDATE charges SET status = :status, predebit_status = :predebit_status,
            predebit_invoice_id = :predebit_invoice_id,
            predebit_approval_status = COALESCE(:predebit_approval_status, predebit_approval_status),
            payu_id = :payu_id,
            attempted_at = :attempted_at, last_checked_at = :last_checked_at, updated_at = :updated_at
         WHERE id = :id'
    );
    $statement->execute([
        ':status' => $values['status'],
        ':predebit_status' => $values['predebit_status'],
        ':predebit_invoice_id' => $values['predebit_invoice_id'],
        ':predebit_approval_status' => $values['predebit_approval_status'] ?? null,
        ':payu_id' => $values['payu_id'],
        ':attempted_at' => $values['attempted_at'],
        ':last_checked_at' => $values['last_checked_at'],
        ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
        ':id' => $chargeId,
    ]);
}

function payu_cron_mark_past_due(PDO $database, array $subscription, string $reason): void
{
    $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM);
    $statement = $database->prepare(
        'UPDATE subscriptions SET status = :status, updated_at = :updated_at WHERE id = :id AND status = \'active\''
    );
    $statement->execute([':status' => 'past_due', ':updated_at' => $now, ':id' => $subscription['id']]);
    if ($statement->rowCount() === 1) {
        $sent = payu_send_email(
            (string)$subscription['email'],
            'Subscription payment needs attention - Digi Shatakshi',
            "Hello {$subscription['customer_name']},\r\n\r\nWe could not continue the automatic monthly payment for your subscription. {$reason}\r\n\r\nNo further recurring payment will be initiated until this is resolved. Contact hello@digishatakshi.com for assistance.\r\n"
        );
        if (!$sent) {
            error_log('PayU past-due notification email could not be accepted by mail().');
        }
    }
}

function payu_cron_mark_captured(PDO $database, array $subscription, array $charge, string $payuId): void
{
    $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM);
    $nextDate = payu_next_month_date((string)$charge['due_date'], (int)$subscription['billing_day']);
    $database->beginTransaction();
    $chargeUpdate = $database->prepare(
        'UPDATE charges SET status = :status, payu_id = :payu_id, last_checked_at = :checked_at, updated_at = :updated_at
         WHERE id = :id AND status IN (\'scheduled\', \'pending\')'
    );
    $chargeUpdate->execute([
        ':status' => 'captured',
        ':payu_id' => $payuId,
        ':checked_at' => $now,
        ':updated_at' => $now,
        ':id' => $charge['id'],
    ]);
    if ($chargeUpdate->rowCount() !== 1) {
        $database->rollBack();
        return;
    }

    $subscriptionUpdate = $database->prepare(
        'UPDATE subscriptions SET next_due_date = :next_due_date, next_seq = next_seq + 1, updated_at = :updated_at
         WHERE id = :id AND status = \'active\''
    );
    $subscriptionUpdate->execute([
        ':next_due_date' => $nextDate,
        ':updated_at' => $now,
        ':id' => $subscription['id'],
    ]);
    $database->commit();

    $plan = payu_plans()[$subscription['plan_id']] ?? null;
    if ($plan !== null) {
        $sent = payu_send_email(
            (string)$subscription['email'],
            'Monthly payment received - Digi Shatakshi',
            "Hello {$subscription['customer_name']},\r\n\r\nWe received your monthly payment of ₹" . number_format((int)$plan['amount']) . " for {$plan['name']}.\r\n\r\nFor questions, contact hello@digishatakshi.com.\r\n"
        );
        if (!$sent) {
            error_log('PayU recurring payment confirmation email could not be accepted by mail().');
        }
    }
    payu_cron_log('Recurring payment captured.');
}

function payu_cron_mark_failed(PDO $database, array $subscription, array $charge, string $message): void
{
    $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM);
    $database->prepare(
        'UPDATE charges SET status = :status, last_checked_at = :checked_at, updated_at = :updated_at WHERE id = :id'
    )->execute([
        ':status' => 'failed',
        ':checked_at' => $now,
        ':updated_at' => $now,
        ':id' => $charge['id'],
    ]);
    payu_cron_mark_past_due($database, $subscription, $message);
}

function payu_cron_process_pending(PDO $database, array $config): void
{
    $statement = $database->query(
        'SELECT c.*, s.plan_id, s.amount AS subscription_amount, s.customer_name, s.email, s.phone,
                s.auth_payu_id, s.payment_mode, s.status AS subscription_status, s.next_due_date,
                s.billing_day, s.payment_end_date, s.next_seq, s.id AS subscription_id
         FROM charges c JOIN subscriptions s ON s.id = c.subscription_id
         WHERE c.status = \'pending\' AND s.status IN (\'active\', \'cancel_requested\')'
    );
    foreach ($statement->fetchAll() as $row) {
        $kind = payu_cron_mandate_kind((string)$row['payment_mode']);
        $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata'));
        $lastChecked = isset($row['last_checked_at']) ? new DateTimeImmutable((string)$row['last_checked_at']) : null;
        $minimumWait = $kind === 'bank' ? 86400 : 600;
        if ($lastChecked !== null && ($now->getTimestamp() - $lastChecked->getTimestamp()) < $minimumWait) {
            continue;
        }

        $subscription = [
            'id' => $row['subscription_id'],
            'plan_id' => $row['plan_id'],
            'amount' => $row['subscription_amount'],
            'customer_name' => $row['customer_name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'auth_payu_id' => $row['auth_payu_id'],
            'payment_mode' => $row['payment_mode'],
            'status' => $row['subscription_status'],
            'next_due_date' => $row['next_due_date'],
            'billing_day' => $row['billing_day'],
            'payment_end_date' => $row['payment_end_date'],
            'next_seq' => $row['next_seq'],
        ];
        try {
            $detail = payu_verify_payment($config, (string)$row['txnid']);
            if ($detail === null) {
                $database->prepare(
                    'UPDATE charges SET last_checked_at = :checked_at, updated_at = :updated_at WHERE id = :id'
                )->execute([
                    ':checked_at' => $now->format(DATE_ATOM),
                    ':updated_at' => $now->format(DATE_ATOM),
                    ':id' => $row['id'],
                ]);
                continue;
            }
            $status = strtolower((string)($detail['status'] ?? ''));
            $unmapped = strtolower((string)($detail['unmappedstatus'] ?? ''));
            $detailTxnid = (string)($detail['txnid'] ?? '');
            $detailAmount = payu_amount_in_paise((string)($detail['amt'] ?? $detail['amount'] ?? $detail['transaction_amount'] ?? ''));
            if ($detailTxnid !== (string)$row['txnid'] || $detailAmount !== payu_amount_in_paise((string)$row['subscription_amount'])) {
                error_log('PayU recurring reconciliation did not match the stored charge.');
                $database->prepare(
                    'UPDATE charges SET last_checked_at = :checked_at, updated_at = :updated_at WHERE id = :id'
                )->execute([
                    ':checked_at' => $now->format(DATE_ATOM),
                    ':updated_at' => $now->format(DATE_ATOM),
                    ':id' => $row['id'],
                ]);
                continue;
            }
            if ($status === 'captured' || $unmapped === 'captured' || ($status === 'success' && $unmapped === '')) {
                payu_cron_mark_captured($database, $subscription, $row, (string)($detail['mihpayid'] ?? ''));
            } elseif (in_array($status, ['failed', 'failure'], true) || in_array($unmapped, ['failed', 'failure'], true)) {
                payu_cron_mark_failed($database, $subscription, $row, 'PayU reported that the latest charge did not complete.');
            } else {
                $database->prepare(
                    'UPDATE charges SET last_checked_at = :checked_at, updated_at = :updated_at WHERE id = :id'
                )->execute([
                    ':checked_at' => $now->format(DATE_ATOM),
                    ':updated_at' => $now->format(DATE_ATOM),
                    ':id' => $row['id'],
                ]);
                $dueDate = new DateTimeImmutable((string)$row['due_date'], new DateTimeZone('Asia/Kolkata'));
                if ($now->diff($dueDate)->days > 3 && $now > $dueDate) {
                    payu_cron_mark_failed($database, $subscription, $row, 'PayU has not returned a final result for the latest charge.');
                }
            }
        } catch (PDOException | RuntimeException | JsonException $error) {
            error_log('PayU recurring payment reconciliation failed: ' . get_class($error));
        }
    }
}

function payu_cron_process_cancellations(PDO $database, array $config): void
{
    $statement = $database->query(
        'SELECT * FROM subscriptions WHERE status = \'cancel_requested\''
    );
    foreach ($statement->fetchAll() as $subscription) {
        if (payu_cron_mandate_kind((string)$subscription['payment_mode']) !== 'bank') {
            continue;
        }
        try {
            $status = payu_cron_mandate_status($config, $subscription, 'bank');
            if ($status === 'cancel_success') {
                $database->prepare(
                    'UPDATE subscriptions SET status = :status, updated_at = :updated_at WHERE id = :id AND status = \'cancel_requested\''
                )->execute([
                    ':status' => 'cancelled',
                    ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
                    ':id' => $subscription['id'],
                ]);
                payu_cron_log('Bank mandate cancellation confirmed.');
            } elseif ($status === 'cancel_failed' || $status === 'cancel_initiation_failed') {
                $database->prepare(
                    'UPDATE subscriptions SET status = :status, updated_at = :updated_at WHERE id = :id AND status = \'cancel_requested\''
                )->execute([
                    ':status' => 'cancel_failed',
                    ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
                    ':id' => $subscription['id'],
                ]);
                error_log('PayU bank mandate cancellation was not confirmed; merchant charges remain paused.');
            }
        } catch (PDOException | RuntimeException | JsonException $error) {
            error_log('PayU cancellation status check failed: ' . get_class($error));
        }
    }
}

function payu_cron_ensure_charge(PDO $database, array $subscription, string $kind, string $now): array
{
    $select = $database->prepare(
        'SELECT * FROM charges WHERE subscription_id = :subscription_id AND due_date = :due_date'
    );
    $select->execute([
        ':subscription_id' => $subscription['id'],
        ':due_date' => $subscription['next_due_date'],
    ]);
    $charge = $select->fetch();
    if (is_array($charge)) {
        return $charge;
    }

    $txnid = bin2hex(random_bytes(12));
    $invoice = 'DS-' . strtoupper(bin2hex(random_bytes(8)));
    $predebitStatus = $kind === 'bank' ? 'not_required' : 'pending';
    $insert = $database->prepare(
        'INSERT INTO charges (
            subscription_id, due_date, txnid, invoice_number, mandate_seq_no,
            status, predebit_status, created_at, updated_at
         ) VALUES (
            :subscription_id, :due_date, :txnid, :invoice_number, :mandate_seq_no,
            :status, :predebit_status, :created_at, :updated_at
         )'
    );
    $insert->execute([
        ':subscription_id' => $subscription['id'],
        ':due_date' => $subscription['next_due_date'],
        ':txnid' => $txnid,
        ':invoice_number' => $invoice,
        ':mandate_seq_no' => $kind === 'upi' ? $subscription['next_seq'] : null,
        ':status' => 'scheduled',
        ':predebit_status' => $predebitStatus,
        ':created_at' => $now,
        ':updated_at' => $now,
    ]);
    $select->execute([
        ':subscription_id' => $subscription['id'],
        ':due_date' => $subscription['next_due_date'],
    ]);
    $charge = $select->fetch();
    if (!is_array($charge)) {
        throw new RuntimeException('The recurring charge record could not be loaded.');
    }

    return $charge;
}

function payu_cron_send_predebit(PDO $database, array $config, array $subscription, array $charge, string $kind): void
{
    $status = payu_cron_mandate_status($config, $subscription, $kind);
    $isActive = $kind === 'bank' ? $status === 'success' : $status === 'active';
    if (!$isActive) {
        payu_cron_mark_past_due($database, $subscription, 'PayU reported that the payment mandate is no longer active.');
        return;
    }

    $var1Data = [
        'authpayuid' => (string)$subscription['auth_payu_id'],
        'requestId' => payu_cron_request_id($charge, 'pre'),
        'amount' => (string)$subscription['amount'],
        'debitDate' => (string)$charge['due_date'],
        'invoiceDisplayNumber' => (string)$charge['invoice_number'],
    ];
    if ($kind === 'upi') {
        $var1Data['mandateSeqNo'] = (int)$charge['mandate_seq_no'];
    }
    $var1 = json_encode($var1Data, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $result = payu_api($config, 'pre_debit_SI', $var1);
    if ((string)($result['status'] ?? '') === '1') {
        $database->prepare(
            'UPDATE charges SET predebit_status = :status, predebit_invoice_id = :invoice_id,
                predebit_approval_status = :approval_status, updated_at = :updated_at WHERE id = :id'
        )->execute([
            ':status' => 'sent',
            ':invoice_id' => (string)($result['invoiceid'] ?? ''),
            ':approval_status' => (string)($result['approvedStatus'] ?? ''),
            ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
            ':id' => $charge['id'],
        ]);
        payu_cron_log('Required pre-debit notification sent.');
        return;
    }

    $database->prepare(
        'UPDATE charges SET predebit_status = :status, updated_at = :updated_at WHERE id = :id'
    )->execute([
        ':status' => 'failed',
        ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
        ':id' => $charge['id'],
    ]);
    error_log('PayU did not accept a pre-debit notification; the scheduler will retry with the same request ID.');
}

function payu_cron_submit_charge(PDO $database, array $config, array $subscription, array $charge, string $kind): void
{
    if ($kind !== 'bank' && $charge['predebit_status'] !== 'sent') {
        payu_cron_mark_past_due($database, $subscription, 'The required pre-debit notification was not confirmed at least 48 hours before the scheduled payment.');
        return;
    }

    if ($kind === 'card' && (int)payu_amount_in_paise((string)$subscription['amount']) > 1500000) {
        $approval = strtolower((string)($charge['predebit_approval_status'] ?? ''));
        if (!in_array($approval, ['approved', 'not_applicable', 'na'], true)) {
            $retrieve = json_encode([
                'authpayuid' => (string)$subscription['auth_payu_id'],
                'requestId' => payu_cron_request_id($charge, 'retrieve'),
                'invoiceDisplayNumber' => (string)$charge['invoice_number'],
                'action' => 'Retrieve',
            ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            $result = payu_api($config, 'pre_debit_SI', $retrieve);
            $approval = strtolower((string)($result['approvedStatus'] ?? ''));
            $database->prepare(
                'UPDATE charges SET predebit_approval_status = :approval, updated_at = :updated_at WHERE id = :id'
            )->execute([
                ':approval' => $approval,
                ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM),
                ':id' => $charge['id'],
            ]);
            $charge['predebit_approval_status'] = $approval;
        }
        if (!in_array($approval, ['approved', 'not_applicable', 'na'], true)) {
            payu_cron_mark_past_due($database, $subscription, 'The card issuer has not confirmed the required recurring-payment approval.');
            return;
        }
    }

    $mandateStatus = payu_cron_mandate_status($config, $subscription, $kind);
    $isActive = $kind === 'bank' ? $mandateStatus === 'success' : $mandateStatus === 'active';
    if (!$isActive) {
        payu_cron_mark_past_due($database, $subscription, 'PayU reported that the payment mandate is no longer active.');
        return;
    }

    $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM);
    payu_cron_update_charge($database, (int)$charge['id'], [
        'status' => 'pending',
        'predebit_status' => $charge['predebit_status'],
        'predebit_invoice_id' => $charge['predebit_invoice_id'],
        'payu_id' => $charge['payu_id'],
        'attempted_at' => $now,
        'last_checked_at' => $now,
    ]);

    $var1Data = [
        'authpayuid' => (string)$subscription['auth_payu_id'],
        'invoiceDisplayNumber' => (string)$charge['invoice_number'],
        'amount' => (string)$subscription['amount'],
        'txnid' => (string)$charge['txnid'],
        'phone' => (string)$subscription['phone'],
        'email' => (string)$subscription['email'],
    ];
    if ($kind === 'upi') {
        $var1Data['mandateSeqNo'] = (int)$charge['mandate_seq_no'];
    }
    $var1 = json_encode($var1Data, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $result = payu_api($config, 'si_transaction', $var1);
    $detail = $result['details'][$charge['txnid']] ?? null;
    if (!is_array($detail)) {
        error_log('PayU did not return a matching recurring payment result; the transaction will be reconciled before further action.');
        return;
    }

    $status = strtolower((string)($detail['status'] ?? ''));
    $detailAmount = payu_amount_in_paise((string)($detail['amount'] ?? ''));
    if ((string)($detail['transactionid'] ?? '') !== (string)$charge['txnid']
        || $detailAmount !== payu_amount_in_paise((string)$subscription['amount'])
        || (string)($detail['authpayuid'] ?? '') !== (string)$subscription['auth_payu_id']) {
        error_log('PayU recurring response did not match the stored charge.');
        return;
    }
    if ($status === 'captured') {
        payu_cron_mark_captured($database, $subscription, $charge, (string)($detail['payuid'] ?? ''));
    } elseif (in_array($status, ['pending', 'in-progress', 'in progress'], true)) {
        payu_cron_update_charge($database, (int)$charge['id'], [
            'status' => 'pending',
            'predebit_status' => $charge['predebit_status'],
            'predebit_invoice_id' => $charge['predebit_invoice_id'],
            'payu_id' => (string)($detail['payuid'] ?? ''),
            'attempted_at' => $now,
            'last_checked_at' => $now,
        ]);
        payu_cron_log('Recurring payment is pending PayU confirmation.');
    } else {
        payu_cron_mark_failed($database, $subscription, $charge, 'PayU reported that the recurring payment did not complete.');
    }
}

try {
    $config = payu_config();
} catch (RuntimeException $error) {
    error_log('PayU recurring worker configuration is invalid.');
    fwrite(STDERR, "PayU recurring worker configuration is invalid.\n");
    exit(1);
}

if ($config === null || $config['key'] === '' || $config['salt'] === '' || $config['enable_recurring_processing'] !== true) {
    payu_cron_log('Recurring processing is disabled or not configured; no payment requests were sent.');
    exit(0);
}

try {
    $database = payu_database();
    $lockPath = payu_private_directory() . DIRECTORY_SEPARATOR . 'cron.lock';
    $lock = fopen($lockPath, 'c');
    if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
        fwrite(STDERR, "Another recurring worker is already running or the lock could not be acquired.\n");
        exit(1);
    }
    if (!chmod($lockPath, 0600)) {
        flock($lock, LOCK_UN);
        fclose($lock);
        throw new RuntimeException('Recurring worker lock permissions could not be secured.');
    }

    payu_cron_process_cancellations($database, $config);
    payu_cron_process_pending($database, $config);

    $today = payu_date_today();
    $threeDaysAhead = (new DateTimeImmutable($today, new DateTimeZone('Asia/Kolkata')))->modify('+3 days')->format('Y-m-d');
    $twoDaysAhead = (new DateTimeImmutable($today, new DateTimeZone('Asia/Kolkata')))->modify('+2 days')->format('Y-m-d');
    $statement = $database->prepare(
        'SELECT * FROM subscriptions WHERE status = \'active\' AND next_due_date <= :end_date ORDER BY next_due_date'
    );
    $statement->execute([':end_date' => $threeDaysAhead]);
    $subscriptions = $statement->fetchAll();

    foreach ($subscriptions as $subscription) {
        $kind = payu_cron_mandate_kind((string)$subscription['payment_mode']);
        $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM);
        $dueDate = (string)$subscription['next_due_date'];
        if ($dueDate > (string)$subscription['payment_end_date']) {
            $database->prepare(
                'UPDATE subscriptions SET status = :status, updated_at = :updated_at WHERE id = :id AND status = \'active\''
            )->execute([':status' => 'expired', ':updated_at' => $now, ':id' => $subscription['id']]);
            continue;
        }
        if ($dueDate < $today) {
            payu_cron_mark_past_due($database, $subscription, 'The scheduled payment date was missed.');
            continue;
        }

        try {
            $charge = payu_cron_ensure_charge($database, $subscription, $kind, $now);
            if ($kind !== 'bank' && $dueDate <= $twoDaysAhead && $charge['predebit_status'] !== 'sent') {
                payu_cron_mark_past_due($database, $subscription, 'The required pre-debit notification could not be confirmed at least 48 hours before the scheduled payment.');
                continue;
            }

            if ($kind !== 'bank' && $dueDate === $threeDaysAhead && in_array($charge['predebit_status'], ['pending', 'failed'], true)) {
                payu_cron_send_predebit($database, $config, $subscription, $charge, $kind);
                continue;
            }

            if ($dueDate === $today && $charge['status'] === 'scheduled') {
                payu_cron_submit_charge($database, $config, $subscription, $charge, $kind);
            }
        } catch (PDOException | RuntimeException | JsonException $error) {
            error_log('PayU recurring cycle failed: ' . get_class($error));
        }
    }

    flock($lock, LOCK_UN);
    fclose($lock);
    payu_cron_log('Recurring worker completed.');
} catch (PDOException | RuntimeException $error) {
    error_log('PayU recurring worker failed: ' . get_class($error));
    fwrite(STDERR, "PayU recurring worker failed. Review the PHP error log.\n");
    exit(1);
}
