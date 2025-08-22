const { chromium } = require('playwright');

async function testFixes() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('Testing BRD-PRD App fixes...');
        
        // Navigate to the new document page
        await page.goto('http://localhost:3003/documents/new');
        console.log('✓ Navigated to new document page');

        // Wait for page to load
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded successfully');

        // Find the textarea (should be a textarea now, not input)
        const textarea = await page.locator('textarea[placeholder*="Tell me about your project"]');
        await textarea.waitFor({ state: 'visible' });
        console.log('✓ Found textarea element (previously was input)');

        // Test Shift+Enter functionality
        console.log('Testing Shift+Enter functionality...');
        await textarea.click();
        await textarea.type('First line');
        await page.keyboard.press('Shift+Enter');
        await textarea.type('Second line');
        
        // Check if the textarea contains both lines
        const textareaValue = await textarea.inputValue();
        if (textareaValue.includes('\n')) {
            console.log('✓ Shift+Enter creates line breaks correctly');
            console.log(`✓ Textarea content: "${textareaValue}"`);
        } else {
            console.log('❌ Shift+Enter not working - no line break found');
        }

        // Test regular Enter (should trigger send)
        console.log('Testing regular Enter functionality...');
        await textarea.clear();
        await textarea.type('Test message');
        
        // Press Enter and see if it gets sent
        await page.keyboard.press('Enter');
        
        // Wait a moment for any potential message to appear
        await page.waitForTimeout(2000);
        
        // Check if the message was sent (textarea should be empty)
        const textareaAfterEnter = await textarea.inputValue();
        if (textareaAfterEnter === '') {
            console.log('✓ Regular Enter sends message correctly');
        } else {
            console.log('❌ Regular Enter not working - message not sent');
        }

        // Take a screenshot of the chat interface
        await page.screenshot({ path: 'chat-interface-test.png', fullPage: true });
        console.log('✓ Screenshot saved as chat-interface-test.png');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
        console.log('✓ Test completed');
    }
}

testFixes();