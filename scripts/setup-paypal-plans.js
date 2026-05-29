/**
 * PayPal Subscription Plan Setup — LuxAura Creation Studio
 * Run once: node scripts/setup-paypal-plans.js
 */

const CLIENT_ID = 'AQLANh57XONxxEKby8lpAuyucueQj9FcFavgX5SJcI66Ist8A5IFjwlcA-xqbjGiigoLhi3kWY1XfodR';
const SECRET    = 'EPPNiA7Plf3a4XxP4S0Bj3rcpRo9h0rKjMR9vwTVMpn9L-sYcA44WYks7RJggJ71v6wN_TTJpOLidwBQ';
const BASE_URL  = 'https://api-m.paypal.com'; // LIVE

async function getToken() {
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token failed: ' + JSON.stringify(data));
  return data.access_token;
}

async function createProduct(token) {
  const res = await fetch(`${BASE_URL}/v1/catalogs/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:        'LuxAura Creation Studio',
      description: 'AI-powered luxury fashion photography platform',
      type:        'SERVICE',
      category:    'SOFTWARE',
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error('Product failed: ' + JSON.stringify(data));
  console.log('✓ Product created:', data.id);
  return data.id;
}

async function createPlan(token, productId, { name, description, price }) {
  const res = await fetch(`${BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id:  productId,
      name,
      description,
      status:      'ACTIVE',
      billing_cycles: [
        {
          frequency:      { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type:    'REGULAR',
          sequence:       1,
          total_cycles:   0, // infinite
          pricing_scheme: { fixed_price: { value: String(price), currency_code: 'USD' } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding:     true,
        setup_fee:                 { value: '0', currency_code: 'USD' },
        setup_fee_failure_action:  'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`Plan "${name}" failed: ` + JSON.stringify(data));
  console.log(`✓ Plan "${name}" ($${price}/mo):`, data.id);
  return data.id;
}

(async () => {
  try {
    console.log('\n── LuxAura PayPal Setup ──────────────────────');
    const token     = await getToken();
    console.log('✓ Authenticated (LIVE)');

    const productId = await createProduct(token);

    const auraId      = await createPlan(token, productId, { name: 'LuxAura Aura',      description: '450 image credits / month',  price: 85  });
    const sovereignId = await createPlan(token, productId, { name: 'LuxAura Sovereign', description: '1000 image credits + 5 video / month', price: 165 });
    const luminaryId  = await createPlan(token, productId, { name: 'LuxAura Luminary',  description: '3000 image credits + 20 video / month', price: 299 });

    console.log('\n── Plan IDs (save these) ─────────────────────');
    console.log(`VITE_PAYPAL_CLIENT_ID=${CLIENT_ID}`);
    console.log(`VITE_PAYPAL_PLAN_AURA=${auraId}`);
    console.log(`VITE_PAYPAL_PLAN_SOVEREIGN=${sovereignId}`);
    console.log(`VITE_PAYPAL_PLAN_LUMINARY=${luminaryId}`);
    console.log(`PAYPAL_CLIENT_ID=${CLIENT_ID}`);
    console.log(`PAYPAL_CLIENT_SECRET=${SECRET}`);
    console.log(`PAYPAL_PLAN_AURA=${auraId}`);
    console.log(`PAYPAL_PLAN_SOVEREIGN=${sovereignId}`);
    console.log(`PAYPAL_PLAN_LUMINARY=${luminaryId}`);
    console.log(`PAYPAL_SANDBOX=false`);
    console.log('─────────────────────────────────────────────\n');

    // Write to a local file for the next step
    const fs = await import('fs');
    fs.writeFileSync('./scripts/.paypal-plan-ids.json', JSON.stringify({
      VITE_PAYPAL_CLIENT_ID:    CLIENT_ID,
      VITE_PAYPAL_PLAN_AURA:    auraId,
      VITE_PAYPAL_PLAN_SOVEREIGN: sovereignId,
      VITE_PAYPAL_PLAN_LUMINARY:  luminaryId,
      PAYPAL_CLIENT_ID:          CLIENT_ID,
      PAYPAL_CLIENT_SECRET:      SECRET,
      PAYPAL_PLAN_AURA:          auraId,
      PAYPAL_PLAN_SOVEREIGN:     sovereignId,
      PAYPAL_PLAN_LUMINARY:      luminaryId,
      PAYPAL_SANDBOX:            'false',
    }, null, 2));
    console.log('✓ Saved to scripts/.paypal-plan-ids.json');
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
})();
