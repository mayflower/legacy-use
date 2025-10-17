INSERT INTO tenant_default.api_definitions (
    id,
    name,
    description,
    created_at,
    updated_at,
    is_archived
) VALUES
(
    'de28fb1e-3d79-4357-8db7-4c438b579d95',
    'GnuCash - Read Account Information',
    'API to get account information',
    NOW(),
    NOW(),
    false
),
(
    '547ca289-9543-49b2-866b-36e5235f1b0c',
    'GnuCash - Add new invoice',
    'Write new information into GnuCash',
    NOW(),
    NOW(),
    false
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_default.api_definition_versions (
    id,
    api_definition_id,
    version_number,
    parameters,
    prompt,
    prompt_cleanup,
    response_example,
    created_at,
    is_active,
    custom_actions
) VALUES
(
    'b6541819-4853-4bb5-ad42-8bb45067055a',
    'de28fb1e-3d79-4357-8db7-4c438b579d95',
    '5',
    '[]',
    'You are acting as an accountant working with GnuCash to extract specific transaction data. Please follow the steps below:

1. In the account overview, locate the **Income** account and click the triangle to its left to expand the subaccounts.

2. From the expanded list, double-click on the subaccount labeled **"Consulting"** to open its transaction view.

3. In the transaction list, locate the entries associated with **CUSTOMER C**.

4. For each transaction related to CUSTOMER C, extract the following information:

   * **Income** (amount)
   * **Date** of the transaction
   * **R** status (reconciliation status)

5. Return the extracted data as a JSON array, where each entry contains `date`, `income`, and `reconciliation_status`.

### Note on the "R" Column:

The "R" column indicates the reconciliation status of a transaction:

* `"n"` = Not reconciled
* `"c"` = Cleared
* `"y"` or `"R"` = Reconciled

### Notes on Popups

* If you see the popup **"GnuCash cannot obtain the lock"**, always click **"Open Anyway"**.
* If you see the popup **"Tip of the Day"**, simply close it.
* If both popups appear, **always handle the "GnuCash cannot obtain the lock" popup first**!
',
    'Close the **"Consulting"** tab.',
    '{"date": "2025-05-15", "income": 1200, "reconciliation_status": "y"}',
    NOW(),
    true,
    '{}'
),
(
    'c3c22f1c-24a6-4655-b1b2-e94f6ae11692',
    '547ca289-9543-49b2-866b-36e5235f1b0c',
    '5',
    '[{"name": "num", "description": "The id of the invoice", "type": "string", "required": false, "default": "NV-010"}, {"name": "description", "description": "Additional information about the invoice", "type": "string", "required": false, "default": "PAID - Customer X"}, {"name": "deposit", "description": "The amount of the transaction to add.", "type": "string", "required": false, "default": "280"}]',
    'You are acting as an accountant working with GnuCash to add a new transaction. Please follow the steps below:

1. In the account overview, locate the **Income** account. Click the triangle to its left to expand its subaccounts.

2. From the expanded list, double-click on the **"Consulting"** subaccount to open its transaction view.

3. Scroll to the bottom of the transaction list and locate the last empty row.

4. In this empty row, enter the following details:

   * **num:** {{num}}
   * **description:** {{description}}
   * **deposit:** {{deposit}}

5. Press **Enter** to save the transaction.

### Notes on Input Data

* If no input data is given, use these as fallback: {''num'': ''NV-010'', ''description'': ''PAID - Customer X'', ''deposit'': ''280''}
* Make sure to be in the actual "Deposit"-column and not in the "Withdraw"-column.

### Notes on Popups

* If you see the popup **"GnuCash cannot obtain the lock"**, always click **"Open Anyway"**.
* If you see the popup **"Tip of the Day"**, simply close it.
* If both popups appear, **always handle the "GnuCash cannot obtain the lock" popup first**!
',
    'Close the **"Consulting"** subaccount tab.',
    '{"success": true}',
    NOW(),
    true,
    '{}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_default.settings (id, key, value, created_at, updated_at)
VALUES (
    '7774a229-d4a1-489e-8351-bca12c65b4a7',
    'ANTHROPIC_API_KEY',
    '${ANTHROPIC_API_KEY}'
    NOW(),
    NOW()
),
(
    '99ccc991-7bd1-44c3-9cf7-a1146ae92356',
    'API_KEY',
    '${POST_INSTALL_API_KEY}'
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
