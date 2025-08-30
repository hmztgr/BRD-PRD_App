// Ultra-comprehensive Firebase blocker - blocks all Firebase-related code
// This runs before any other JavaScript to prevent Firebase from loading at all

console.log('[Ultra Firebase Blocker] Starting comprehensive Firebase blocking...');

// Block at the earliest possible stage
(function() {
  'use strict';
  
  // 1. Block module imports/requires
  if (typeof window !== 'undefined') {
    // Block common Firebase modules
    const blockedModules = [
      'firebase',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/analytics',
      '@firebase/app',
      '@firebase/auth',
      '@firebase/firestore',
      '@firebase/analytics',
      'firebase-tools',
      'firebase-admin'
    ];
    
    // Override require if it exists
    if (typeof window.require !== 'undefined') {
      const originalRequire = window.require;
      window.require = function(module) {
        if (typeof module === 'string' && blockedModules.some(blocked => module.includes(blocked))) {
          console.warn('[Ultra Firebase Blocker] BLOCKED require:', module);
          return {};
        }
        return originalRequire.apply(this, arguments);
      };
    }
    
    // Block dynamic imports
    const originalImport = window.import || (() => {});
    window.import = function(module) {
      if (typeof module === 'string' && blockedModules.some(blocked => module.includes(blocked))) {
        console.warn('[Ultra Firebase Blocker] BLOCKED import:', module);
        return Promise.resolve({});
      }
      return originalImport.apply(this, arguments);
    };
  }
  
  // 2. Block network requests even more aggressively
  if (typeof window !== 'undefined') {
    // Block fetch
    if (window.fetch) {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const resource = args[0];
        if (typeof resource === 'string') {
          const firebasePatterns = [
            'firebase.googleapis.com',
            'securetoken.googleapis.com',
            'identitytoolkit.googleapis.com',
            'firebaseapp.com',
            'firestore.googleapis.com',
            'firebase-settings.crashlytics.com',
            'firebase.google.com',
            'firebase-api.googleapis.com'
          ];
          
          if (firebasePatterns.some(pattern => resource.includes(pattern))) {
            console.warn('[Ultra Firebase Blocker] BLOCKED fetch:', resource);
            return Promise.reject(new Error('Firebase blocked by ultra-blocker'));
          }
        }
        return originalFetch.apply(this, args);
      };
    }
    
    // Block XMLHttpRequest
    if (window.XMLHttpRequest) {
      const OriginalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        const xhr = new OriginalXHR();
        const originalOpen = xhr.open;
        xhr.open = function(method, url, ...args) {
          if (typeof url === 'string') {
            const firebasePatterns = [
              'firebase.googleapis.com',
              'securetoken.googleapis.com',
              'identitytoolkit.googleapis.com',
              'firebaseapp.com',
              'firestore.googleapis.com'
            ];
            
            if (firebasePatterns.some(pattern => url.includes(pattern))) {
              console.warn('[Ultra Firebase Blocker] BLOCKED XHR:', url);
              throw new Error('Firebase XHR blocked by ultra-blocker');
            }
          }
          return originalOpen.call(this, method, url, ...args);
        };
        return xhr;
      };
    }
  }
  
  // 3. Block Firebase globals more comprehensively
  if (typeof window !== 'undefined') {
    const firebaseGlobals = [
      'firebase',
      'Firebase',
      'FIREBASE_CONFIG',
      '__FIREBASE_DEFAULTS__',
      '_firebase'
    ];
    
    firebaseGlobals.forEach(globalName => {
      Object.defineProperty(window, globalName, {
        get: function() {
          console.warn(`[Ultra Firebase Blocker] Blocked access to ${globalName} global`);
          return undefined;
        },
        set: function() {
          console.warn(`[Ultra Firebase Blocker] Blocked assignment to ${globalName} global`);
          return false;
        },
        configurable: false,
        enumerable: false
      });
    });
    
    // Block Firebase functions that might be called
    const blockFirebaseFunction = (name) => {
      return function() {
        console.warn(`[Ultra Firebase Blocker] Blocked Firebase function: ${name}`);
        throw new Error(`Firebase function ${name} blocked by ultra-blocker`);
      };
    };
    
    const firebaseFunctions = [
      'initializeApp',
      'getAuth',
      'getFirestore',
      'getAnalytics',
      'connectAuthEmulator',
      'connectFirestoreEmulator'
    ];
    
    firebaseFunctions.forEach(funcName => {
      try {
        window[funcName] = blockFirebaseFunction(funcName);
      } catch (e) {
        // Ignore if property can't be set
      }
    });
  }
  
  // 4. Block at the script level - prevent Firebase scripts from executing
  if (typeof document !== 'undefined') {
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);
      
      if (tagName.toLowerCase() === 'script') {
        const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src').set;
        Object.defineProperty(element, 'src', {
          set: function(value) {
            if (typeof value === 'string' && value.includes('firebase')) {
              console.warn('[Ultra Firebase Blocker] BLOCKED script src:', value);
              return;
            }
            originalSrcSetter.call(this, value);
          },
          get: function() {
            return this.getAttribute('src');
          }
        });
      }
      
      return element;
    };
  }
  
})();

console.log('[Ultra Firebase Blocker] Comprehensive Firebase blocking activated');