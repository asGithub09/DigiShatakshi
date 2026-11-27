# PayU setup

The PayU integration is disabled until a private configuration file is created on Hostinger. Do not put merchant credentials in this repository, in chat, or in a public file.

## Private configuration

In Hostinger File Manager, create `payu-config.php` in the domain directory **above** `public_html`, not inside it:

`/home/u367053004/domains/digishatakshi.com/payu-config.php`

Use the structure in `payu-config.example.php`, then enter the sandbox merchant key and salt directly in Hostinger's file editor. Initially keep:

- `mode` set to `test`
- `enable_checkout` set to `false` until PayU's sandbox flow is ready to test
- `enable_recurring_processing` set to `false` until recurring test payments have been verified

For sandbox testing, set `enable_checkout` to `true` and visit a checkout URL directly (for example `https://digishatakshi.com/payu-checkout.php?plan=smm-basic`). Sandbox mode does not display payment buttons on the public pricing cards. After testing, switch to production credentials and set `mode` to `production`; payment buttons then appear automatically when checkout is enabled.

Never deploy the private file or copy its contents into the repository.

## PayU dashboard prerequisites

Enable **Pay and Subscribe** for the sandbox account and confirm the hosted checkout methods your merchant account supports. Monthly plans use PayU's `SI=4` flow: the first listed monthly amount is collected at signup, followed by monthly charges until the customer cancels. Website packages are one-time payments. The amount sent to PayU is the package's displayed amount; the checkout does not add a separate tax line.

PayU requires an end date for a mandate. The integration sets a 30-year horizon, which can be revoked sooner through the emailed self-service cancellation link. Net Banking/eNACH cancellation can remain pending while the bank processes the request; merchant-initiated debits stop immediately after the customer requests cancellation.

PayU currently limits UPI mandates to ₹15,000 per recurring debit. For a higher-priced monthly package, the customer must select another eligible mandate method shown by PayU.

## Recurring scheduler

After confirming sandbox recurring charges and cancellation, enable recurring processing in the private config and create an hourly Hostinger cron job:

`php /home/u367053004/domains/digishatakshi.com/public_html/payu-cron.php`

The scheduler checks mandate state, sends required card/UPI pre-debit notifications at least 48 hours before a debit, and submits recurring charges on their due date. Do not enable the scheduler in production until the merchant has completed sandbox checkout, renewal, and cancellation tests.
