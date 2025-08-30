// Aggressive Firebase blocker
// This prevents any accidental Firebase quota usage

if (typeof window !== 'undefined') {
  console.log('[Firebase Blocker] Initializing aggressive Firebase blocker...');
  
  // 1. Override fetch API
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [resource, options] = args;
    
    // Block Firebase API calls
    if (typeof resource === 'string' && (
      resource.includes('firebase.googleapis.com') ||
      resource.includes('securetoken.googleapis.com') ||
      resource.includes('identitytoolkit.googleapis.com') ||
      resource.includes('firebaseapp.com')
    )) {
      console.warn('[Firebase Blocker] Blocked Firebase API call to:', resource);
      return Promise.reject(new Error('Firebase calls blocked to prevent quota issues'));
    }
    
    return originalFetch.apply(this, args);
  };
  
  // 2. Override XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    
    xhr.open = function(method, url, ...args) {
      if (typeof url === 'string' && (
        url.includes('firebase.googleapis.com') ||
        url.includes('securetoken.googleapis.com') ||
        url.includes('identitytoolkit.googleapis.com') ||
        url.includes('firebaseapp.com')
      )) {
        console.warn('[Firebase Blocker] Blocked XHR Firebase call to:', url);
        throw new Error('Firebase XHR calls blocked to prevent quota issues');
      }
      return originalOpen.call(this, method, url, ...args);
    };
    
    return xhr;
  };
  
  // 3. Block Firebase global objects
  Object.defineProperty(window, 'firebase', {
    get: function() {
      console.warn('[Firebase Blocker] Blocked access to firebase global object');
      return undefined;
    },
    set: function() {
      console.warn('[Firebase Blocker] Blocked firebase global object assignment');
      return false;
    }
  });
  
  // 4. Block common Firebase initialization patterns
  const blockFirebaseFunction = () => {
    console.warn('[Firebase Blocker] Blocked Firebase function call');
    throw new Error('Firebase functions blocked to prevent quota issues');
  };
  
  // Override potential Firebase globals
  (window as any).initializeApp = blockFirebaseFunction;
  (window as any).getAuth = blockFirebaseFunction;
  (window as any).getFirestore = blockFirebaseFunction;
  
  console.log('[Firebase Blocker] Firebase blocker initialized successfully');
}

export {};