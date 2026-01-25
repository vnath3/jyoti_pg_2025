const buildCorsHeaders = function () {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
};

exports.handler = async function (event) {
  const corsHeaders = buildCorsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'method_not_allowed' })
    };
  }

  const submitUrl = process.env.UNI_LEADS_SUBMIT_URL || 'https://uni-leads.netlify.app/api/lead-submit';
  const tenantSlug = process.env.UNI_LEADS_TENANT_SLUG || 'jyoti-pg';

  let payload = {};
  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body;
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'invalid_json' })
    };
  }

  const outboundPayload = Object.assign({}, payload, {
    identity_type: 'slug',
    identity_value: tenantSlug,
    tenant_slug: tenantSlug
  });

  if (!outboundPayload.source) {
    outboundPayload.source = 'jyotipg_marketing';
  }

  if (!outboundPayload.campaign) {
    outboundPayload.campaign = 'organic';
  }

  try {
    const response = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(outboundPayload)
    });

    const responseText = await response.text();

    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: responseText || ''
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'upstream_error' })
    };
  }
};
