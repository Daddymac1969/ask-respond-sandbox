// Contact form handler - sends email via FormSubmit.co (no API key needed)

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = new URLSearchParams(event.body);
    const data = {
      name: body.get('name'),
      email: body.get('email'),
      type: body.get('type'),
      message: body.get('message'),
      timestamp: new Date().toISOString()
    };

    // Validate
    if (!data.name || !data.email || !data.message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // Email address to receive submissions - CHANGE THIS TO YOUR EMAIL
    const RECIPIENT_EMAIL = process.env.CONTACT_EMAIL || 'darren@respondsafeguarding.org';

    // Send via FormSubmit.co (free, no signup required)
    const emailResponse = await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `[Ask RESPOND] ${data.type || 'Contact'}: Message from ${data.name}`,
        name: data.name,
        email: data.email,
        type: data.type || 'General',
        message: data.message,
        timestamp: data.timestamp
      })
    });
    
    const emailResult = await emailResponse.json();
    
    if (!emailResult.success) {
      console.error('Email failed:', emailResult);
      // Still return success to user - we don't want them to retry
      console.log('Submission data:', JSON.stringify(data, null, 2));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Message sent successfully' })
    };

  } catch (error) {
    console.error('Contact form error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
