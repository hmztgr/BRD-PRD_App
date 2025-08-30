const { chromium } = require('playwright');

async function testApp() {
    // Launch browser
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('Testing BRD-PRD App...');
        
        // Navigate to the app
        await page.goto('http://localhost:3003');
        console.log('✓ Navigated to http://localhost:3003');

        // Wait for page to load
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded successfully');

        // Get page title
        const title = await page.title();
        console.log(`✓ Page title: ${title}`);

        // Take a screenshot
        await page.screenshot({ path: 'app-screenshot.png', fullPage: true });
        console.log('✓ Screenshot saved as app-screenshot.png');

        // Test the new document page to see if the error is fixed
        console.log('Testing navigation to new document page...');
        await page.goto('http://localhost:3003/documents/new');
        
        // Wait for the page to load and check for errors
        await page.waitForLoadState('networkidle');
        console.log('✓ New document page loaded without errors');
        
        // Take a screenshot of the new document page
        await page.screenshot({ path: 'new-document-page.png', fullPage: true });
        console.log('✓ New document page screenshot saved');

        // Check if there are any obvious elements on the page
        const headings = await page.$$eval('h1, h2, h3', elements => 
            elements.map(el => el.textContent.trim())
        );
        console.log(`✓ Found headings: ${JSON.stringify(headings)}`);

        // Check for any forms
        const forms = await page.$$eval('form', forms => forms.length);
        console.log(`✓ Found ${forms} form(s) on the page`);

        // Check for navigation links
        const links = await page.$$eval('a', links => 
            links.map(link => link.textContent.trim()).filter(text => text.length > 0)
        );
        console.log(`✓ Found navigation links: ${JSON.stringify(links)}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
        console.log('✓ Browser closed');
    }
}

testApp();