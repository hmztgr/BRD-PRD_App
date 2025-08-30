'use client'

import React from 'react'

export default function TestCSPPage() {
  const testUnsafeEval = () => {
    try {
      // This should be blocked by CSP in production
      // @ts-ignore
      eval('console.log("This should be blocked")')
      alert('eval() worked - CSP is not blocking it')
    } catch (error) {
      alert('eval() was blocked by CSP - security working!')
    }
  }

  const testSafeSetTimeout = () => {
    // This should work fine
    setTimeout(() => {
      alert('Safe setTimeout with function callback works!')
    }, 100)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">CSP Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
          <h2 className="text-xl font-semibold mb-2">⚠️ CSP Security Test</h2>
          <p className="mb-4">
            This page tests Content Security Policy enforcement. 
            The eval() test should be blocked in production but may work in development.
          </p>
          
          <div className="space-x-4">
            <button 
              onClick={testUnsafeEval}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Test eval() (Should be blocked)
            </button>
            
            <button 
              onClick={testSafeSetTimeout}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Safe setTimeout (Should work)
            </button>
          </div>
        </div>

        <div className="p-4 bg-blue-100 border border-blue-400 rounded">
          <h2 className="text-xl font-semibold mb-2">ℹ️ Environment Info</h2>
          <p>Environment: {process.env.NODE_ENV}</p>
          <p>Check browser console for CSP violation reports.</p>
        </div>
      </div>
    </div>
  )
}