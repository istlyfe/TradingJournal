// Edge function to handle Next.js routing in Netlify
export default async function handler(request, context) {
  const url = new URL(request.url);
  
  // If the path doesn't end with a file extension, it's likely a Next.js route
  if (!url.pathname.match(/\.\w+$/)) {
    // Rewrite to index.html and let client-side routing handle it
    return context.rewrite('/');
  }

  // Otherwise, continue with the normal request
  return context.next();
} 