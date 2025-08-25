module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    // Prevent unsafe eval patterns that can cause CSP violations
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    // Custom rule to catch setTimeout/setInterval with strings
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="setTimeout"][arguments.0.type="Literal"]',
        message: 'setTimeout with string argument is not allowed. Use a function instead.'
      },
      {
        selector: 'CallExpression[callee.name="setInterval"][arguments.0.type="Literal"]',
        message: 'setInterval with string argument is not allowed. Use a function instead.'
      },
      {
        selector: 'CallExpression[callee.name="execScript"]',
        message: 'execScript is not allowed as it can cause CSP violations.'
      }
    ]
  }
};
