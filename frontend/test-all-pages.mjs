import { chromium } from 'playwright'

const errors = []
const browser = await chromium.launch({ channel: 'chromium', executablePath: 'C:\\Users\\obume\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe' })
const page = await browser.newPage()
page.on('pageerror', err => { errors.push(err.message); console.log('[pageerror]', err.message) })
page.on('console', msg => { if (msg.type() === 'error') console.log('[console-error]', msg.text()) })
page.on('response', r => { if (r.status() >= 400) console.log('[http]', r.status(), r.url()) })

await page.addInitScript(() => {
  localStorage.setItem('tenantUser', JSON.stringify({ id: 1, business_name: 'QA' }))
})

const pages = [
    '/dashboard',
    '/routers',
    '/branch',
    '/packages',
    '/vouchers',
    '/customers',
    '/payments',
    '/income',
    '/withdrawals',
    '/sessions',
    '/settings',
    '/admin',
]

for (const path of pages) {
    console.log(`\n=== Testing ${path} ===`)
    await page.goto(`http://localhost:8000${path}`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const text = await page.evaluate(() => document.body.innerText.slice(0, 200))
    console.log('Content:', text.slice(0, 150))
}

console.log('\n=== ALL ERRORS ===', errors)
await browser.close()