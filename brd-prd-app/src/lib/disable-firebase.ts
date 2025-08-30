// Disable Firebase client-side initialization
// This prevents any accidental Firebase quota usage

if (typeof window !== 'undefined') {
  // Override Firebase initialization if it gets loaded
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [resource, options] = args;
    
    // Block Firebase API calls
    if (typeof resource === 'string' && (
      resource.includes('firebase.googleapis.com') ||
      resource.includes('securetoken.googleapis.com') ||
      resource.includes('identitytoolkit.googleapis.com')
    )) {
      console.warn('[Firebase Blocker] Blocked Firebase API call to:', resource);
      return Promise.reject(new Error('Firebase calls blocked to prevent quota issues'));
    }
    
    return originalFetch.apply(this, args);
  };
}

export {};