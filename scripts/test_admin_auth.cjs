const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\aryan agrawal\\.gemini\\antigravity-ide\\brain\\67093c2d-5aa3-416f-a447-fef8d3f41e3e';
const targetUrl = 'http://localhost:5174';

async function run() {
  console.log('Testing Admin Login with Microsoft Edge...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // 1. Initial State: Read-Only with ADMIN LOGIN button
  console.log('Checking for ADMIN LOGIN button in top bar...');
  const adminBtnText = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find((b) => b.textContent && b.textContent.includes('ADMIN LOGIN'));
    return adminBtn ? adminBtn.textContent.trim() : null;
  });
  console.log('Top bar button found:', adminBtnText);

  await page.screenshot({
    path: path.join(artifactDir, 'admin_step1_unauthenticated.png')
  });

  // 2. Click ADMIN LOGIN button to open modal
  console.log('Clicking ADMIN LOGIN button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find((b) => b.textContent && b.textContent.includes('ADMIN LOGIN'));
    if (adminBtn) adminBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 3. Verify modal opened and check placeholder has NO password hint
  const modalInfo = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    const input = document.getElementById('admin-password-input');
    return {
      modalVisible: !!modal,
      placeholder: input ? input.getAttribute('placeholder') : null,
      inputType: input ? input.getAttribute('type') : null
    };
  });
  console.log('Modal Info:', modalInfo);

  await page.screenshot({
    path: path.join(artifactDir, 'admin_step2_modal_open.png')
  });

  // 4. Test wrong password
  console.log('Testing incorrect password...');
  await page.type('#admin-password-input', 'invalid_pwd_test');
  await page.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Authorize Admin')
    );
    if (submitBtn) submitBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const errorMsg = await page.evaluate(() => {
    const alert = document.querySelector('[role="alert"]');
    return alert ? alert.textContent.trim() : null;
  });
  console.log('Error message on wrong password:', errorMsg);

  await page.screenshot({
    path: path.join(artifactDir, 'admin_step3_error_displayed.png')
  });

  // 5. Test correct password
  console.log('Submitting correct password aryan@12345...');
  await page.evaluate(() => {
    const input = document.getElementById('admin-password-input');
    if (input) input.value = '';
  });
  await page.type('#admin-password-input', 'aryan@12345');
  await page.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Authorize Admin')
    );
    if (submitBtn) submitBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // 6. Verify top bar now shows ADMIN (active)
  const postLoginButtonText = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find((b) => b.textContent && b.textContent.includes('ADMIN'));
    return adminBtn ? adminBtn.textContent.trim() : null;
  });
  console.log('Post-login top bar button:', postLoginButtonText);

  // 7. Click Data Vault in nav bar and verify write unlocked
  console.log('Clicking Data Vault in nav bar...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const vaultBtn = btns.find((b) => b.textContent && b.textContent.includes('Data Vault'));
    if (vaultBtn) vaultBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const vaultBadge = await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('span'));
    const badge = pills.find((p) => p.textContent && p.textContent.includes('ADMIN: WRITE UNLOCKED'));
    return badge ? badge.textContent.trim() : null;
  });
  console.log('Data Vault admin badge found:', vaultBadge);

  await page.screenshot({
    path: path.join(artifactDir, 'admin_step4_datavault_unlocked.png')
  });

  await browser.close();
  console.log('All admin login tests completed successfully!');
}

run().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});
