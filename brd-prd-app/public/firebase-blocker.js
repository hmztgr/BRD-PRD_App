// Ultra-aggressive Firebase blocker - loaded in HTML head
// This runs before any other JavaScript to prevent Firebase quota issues

console.log('[Firebase Ultra-Blocker] Starting ultra-aggressive Firebase blocker...');

// Block fetch API immediately - but only Firebase domains
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const resource = args[0];
    if (typeof resource === 'string' && (
      resource.includes('firebase.googleapis.com') ||
      resource.includes('securetoken.googleapis.com') ||
      resource.includes('identitytoolkit.googleapis.com') ||
      resource.includes('firebaseapp.com') ||
      resource.includes('firestore.googleapis.com')
    )) {
      console.warn('[Firebase Ultra-Blocker] BLOCKED Firebase API:', resource);
      return Promise.reject(new Error('Firebase blocked to prevent quota exceeded'));
    }
    return originalFetch.apply(this, args);
  };
}

// Block XMLHttpRequest immediately  
if (typeof window !== 'undefined' && window.XMLHttpRequest) {
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    xhr.open = function(method, url, ...args) {
      if (typeof url === 'string' && (
        url.includes('firebase.googleapis.com') ||
        url.includes('securetoken.googleapis.com') ||
        url.includes('identitytoolkit.googleapis.com') ||
        url.includes('firebaseapp.com') ||
        url.includes('firestore.googleapis.com')
      )) {
        console.warn('[Firebase Ultra-Blocker] BLOCKED XHR:', url);
        throw new Error('Firebase XHR blocked');
      }
      return originalOpen.call(this, method, url, ...args);
    };
    return xhr;
  };
}

// Block firebase globals immediately
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'firebase', {
    get: () => { console.warn('[Firebase Ultra-Blocker] firebase global blocked'); return undefined; },
    set: () => { console.warn('[Firebase Ultra-Blocker] firebase assignment blocked'); }
  });
}

console.log('[Firebase Ultra-Blocker] Firebase ultra-blocker activated');