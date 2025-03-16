// This file provides a fallback for handling Next.js dynamic routes in Netlify
exports.handler = async (event, context) => {
  // Return the index page for all routes, let client-side routing handle it
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Trading Journal</title>
          <script>
            // Redirect to the proper URL
            window.location.href = '/';
          </script>
        </head>
        <body>
          <p>Redirecting...</p>
        </body>
      </html>
    `,
  };
}; 