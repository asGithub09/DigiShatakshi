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

if (empty($_SESSION['payu_cancel_csrf'])) {
    $_SESSION['payu_cancel_csrf'] = bin2hex(random_bytes(32));
}

function payu_mandate_kind(string $mode): string
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

function payu_cancel_lookup(PDO $database, string $token): ?array
{
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    $statement = $database->prepare('SELECT * FROM subscriptions WHERE cancel_token_hash = :token_hash');
    $statement->execute([':token_hash' => payu_cancel_token_hash($token)]);
    $subscription = $statement->fetch();
    return is_array($subscription) ? $subscription : null;
}

function payu_cancel_json_input(): array
{
    $body = file_get_contents('php://input');
    if ($body === false || strlen($body) > 4000) {
        throw new RuntimeException('Invalid cancellation request.');
    }
    $input = json_decode($body, true, 16, JSON_THROW_ON_ERROR);
    if (!is_array($input)) {
        throw new RuntimeException('Invalid cancellation request.');
    }
    return $input;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    try {
        $input = payu_cancel_json_input();
        $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!is_string($csrf) || !hash_equals((string)$_SESSION['payu_cancel_csrf'], $csrf)) {
            payu_json_response(403, ['success' => false, 'message' => 'This session expired. Reload the page and try again.']);
        }

        $token = $input['token'] ?? '';
        $action = $input['action'] ?? '';
        if (!is_string($token) || !is_string($action) || !in_array($action, ['preview', 'cancel'], true)) {
            payu_json_response(400, ['success' => false, 'message' => 'The cancellation link is invalid.']);
        }

        $database = payu_database();
        $subscription = payu_cancel_lookup($database, $token);
        if ($subscription === null) {
            payu_json_response(404, ['success' => false, 'message' => 'This cancellation link is invalid. Contact hello@digishatakshi.com for help.']);
        }

        $plan = payu_plans()[$subscription['plan_id']] ?? null;
        if ($plan === null) {
            payu_json_response(500, ['success' => false, 'message' => 'Subscription details could not be loaded. Contact hello@digishatakshi.com.']);
        }

        if ($action === 'preview') {
            payu_json_response(200, [
                'success' => true,
                'plan' => $plan['name'],
                'amount' => number_format((int)$plan['amount']),
                'nextDueDate' => (string)$subscription['next_due_date'],
                'status' => (string)$subscription['status'],
            ]);
        }

        if ($subscription['status'] === 'cancelled') {
            payu_json_response(200, ['success' => true, 'message' => 'This subscription is already cancelled. No further payments will be initiated.']);
        }
        if ($subscription['status'] === 'cancel_requested') {
            payu_json_response(200, ['success' => true, 'message' => 'Cancellation has already been requested. No further payments will be initiated. Bank processing may take one or two business days.']);
        }
        if (!in_array($subscription['status'], ['active', 'past_due', 'paused', 'cancel_failed', 'expired'], true)) {
            payu_json_response(409, ['success' => false, 'message' => 'This subscription is not active. Contact hello@digishatakshi.com if you need help.']);
        }

        $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM);
        $update = $database->prepare(
            'UPDATE subscriptions SET status = :status, updated_at = :updated_at
             WHERE id = :id AND status IN (\'active\', \'past_due\', \'paused\', \'cancel_failed\', \'expired\')'
        );
        $update->execute([
            ':status' => 'cancel_requested',
            ':updated_at' => $now,
            ':id' => $subscription['id'],
        ]);
        if ($update->rowCount() !== 1) {
            payu_json_response(409, ['success' => false, 'message' => 'The subscription changed while processing. Reload the page to see its current status.']);
        }

        try {
            $config = payu_config();
            if ($config === null || $config['key'] === '' || $config['salt'] === '') {
                throw new RuntimeException('Private PayU credentials are not configured.');
            }

            $kind = payu_mandate_kind((string)$subscription['payment_mode']);
            $command = $kind === 'upi' ? 'upi_mandate_revoke' : 'mandate_revoke';
            $var1 = json_encode([
                'authPayuId' => (string)$subscription['auth_payu_id'],
                'requestId' => bin2hex(random_bytes(12)),
            ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            $result = payu_api($config, $command, $var1);
            $accepted = (string)($result['status'] ?? '') === '1';

            if ($accepted && $kind !== 'bank') {
                $markCancelled = $database->prepare(
                    'UPDATE subscriptions SET status = :status, updated_at = :updated_at WHERE id = :id AND status = \'cancel_requested\''
                );
                $markCancelled->execute([
                    ':status' => 'cancelled',
                    ':updated_at' => $now,
                    ':id' => $subscription['id'],
                ]);
                payu_json_response(200, ['success' => true, 'message' => 'Your subscription has been cancelled. No further payments will be initiated.']);
            }

            if ($accepted) {
                payu_json_response(200, ['success' => true, 'message' => 'Your cancellation request was sent to the bank. No further payments will be initiated while the bank completes processing, which may take one or two business days.']);
            }

            $failedAt = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DATE_ATOM);
            $database->prepare(
                'UPDATE subscriptions SET status = :status, updated_at = :updated_at WHERE id = :id AND status = \'cancel_requested\''
            )->execute([
                ':status' => 'cancel_failed',
                ':updated_at' => $failedAt,
                ':id' => $subscription['id'],
            ]);
            error_log('PayU did not acknowledge a subscription cancellation request.');
            payu_json_response(502, ['success' => false, 'message' => 'We stopped future payments from this site, but PayU did not confirm the mandate change. Contact hello@digishatakshi.com so we can follow up with PayU.']);
        } catch (RuntimeException | JsonException $error) {
            error_log('PayU subscription cancellation failed: ' . get_class($error));
            payu_json_response(502, ['success' => false, 'message' => 'Future payments from this site are paused, but PayU could not confirm the cancellation request. Contact hello@digishatakshi.com for help.']);
        }
    } catch (PDOException | RuntimeException | JsonException $error) {
        error_log('PayU cancellation request could not be processed: ' . get_class($error));
        payu_json_response(500, ['success' => false, 'message' => 'We could not load or update this subscription. Contact hello@digishatakshi.com for help.']);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET, POST');
    http_response_code(405);
    payu_html_page('Method not allowed', '<h1>Method not allowed</h1><p>Reload the cancellation link to continue.</p>');
    exit;
}

$csrf = json_encode((string)$_SESSION['payu_cancel_csrf'], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$content = '<h1>Manage subscription</h1><p id="cancel-message" class="notice">Checking your secure cancellation link…</p>'
    . '<div id="cancel-details" hidden><div class="summary"><span>Package</span><strong id="cancel-plan"></strong></div>'
    . '<div class="summary"><span>Monthly amount</span><strong id="cancel-amount"></strong></div>'
    . '<div class="summary"><span>Next scheduled date</span><strong id="cancel-date"></strong></div>'
    . '<p class="muted">If you continue, no further payments will be initiated by Digi Shatakshi. Some bank mandates may take one or two business days to show the final cancellation status.</p>'
    . '<button id="cancel-button" type="button" disabled>Cancel subscription</button></div>'
    . '<a class="back" href="/">Return to Digi Shatakshi</a>';
$script = 'const csrf = ' . $csrf . ';
const message = document.getElementById("cancel-message");
const details = document.getElementById("cancel-details");
const cancelButton = document.getElementById("cancel-button");
const token = window.location.hash.slice(1);
history.replaceState(null, "", window.location.pathname);
const request = async (action) => {
  const response = await fetch(window.location.pathname, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf, "Accept": "application/json" },
    body: JSON.stringify({ action, token })
  });
  const result = await response.json();
  if (!response.ok || result.success !== true) throw new Error(result.message || "The request could not be completed.");
  return result;
};
if (!/^[a-f0-9]{64}$/.test(token)) {
  message.textContent = "This cancellation link is invalid or incomplete. Contact hello@digishatakshi.com for help.";
} else {
  request("preview").then(result => {
    document.getElementById("cancel-plan").textContent = result.plan;
    document.getElementById("cancel-amount").textContent = "₹" + result.amount;
    document.getElementById("cancel-date").textContent = result.nextDueDate;
    if (!["active", "past_due", "paused", "cancel_failed", "expired"].includes(result.status)) {
      message.textContent = result.status === "cancelled" ? "This subscription has already been cancelled." : "Cancellation is already pending; no further payments will be initiated.";
      return;
    }
    message.textContent = result.status === "active"
      ? "Confirm if you want to stop this monthly subscription."
      : "This subscription is not currently billing. You can still revoke its PayU mandate here.";
    details.hidden = false;
    cancelButton.disabled = false;
  }).catch(error => {
    message.textContent = error.message;
  });
}
cancelButton.addEventListener("click", async () => {
  cancelButton.disabled = true;
  message.textContent = "Submitting your cancellation request…";
  try {
    const result = await request("cancel");
    message.textContent = result.message;
    details.hidden = true;
  } catch (error) {
    message.textContent = error.message;
    cancelButton.disabled = false;
  }
});';
payu_html_page('Manage subscription', $content, $script);
