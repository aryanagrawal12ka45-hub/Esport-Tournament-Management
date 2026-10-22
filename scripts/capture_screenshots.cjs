const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\aryan agrawal\\.gemini\\antigravity-ide\\brain\\67093c2d-5aa3-416f-a447-fef8d3f41e3e';
const targetUrl = 'http://localhost:5174';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('Launching Edge for screenshot verification...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. LIGHT THEME - Expanded (Command Center)
  console.log('1. Setting to light theme...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('arenadb_theme_mode', 'light');
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Capturing: light_expanded_command_center.png');
  await page.screenshot({
    path: path.join(artifactDir, 'light_expanded_command_center.png')
  });

  // 2. LIGHT THEME - Switch to Integrity Desk
  console.log('2. Switching to Integrity Desk...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Integrity Desk'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('Capturing: light_expanded_integrity_desk.png');
  await page.screenshot({
    path: path.join(artifactDir, 'light_expanded_integrity_desk.png')
  });

  // 3. LIGHT THEME - Hover on Scoring Academy
  console.log('3. Hovering on Scoring Academy...');
  const academyBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('Scoring Academy'));
  });
  if (academyBtn && academyBtn.asElement()) {
    await academyBtn.asElement().hover();
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('Capturing: light_hover_item.png');
  await page.screenshot({
    path: path.join(artifactDir, 'light_hover_item.png')
  });

  // 4. LIGHT THEME - Keyboard Focus
  console.log('4. Keyboard focusing nav item...');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await new Promise(r => setTimeout(r, 400));

  console.log('Capturing: light_keyboard_focus.png');
  await page.screenshot({
    path: path.join(artifactDir, 'light_keyboard_focus.png')
  });

  // 5. LIGHT THEME - Collapsed Rail (72px)
  console.log('5. Collapsing sidebar in light theme...');
  await page.evaluate(() => {
    const collapseBtn = document.querySelector('button[title*="Collapse sidebar"], button[aria-label*="Collapse sidebar"]');
    if (collapseBtn) collapseBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Capturing: light_collapsed.png');
  await page.screenshot({
    path: path.join(artifactDir, 'light_collapsed.png')
  });

  // 6. DARK THEME - Expanded (Command Center)
  console.log('6. Switching to dark theme and expanding...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('arenadb_theme_mode', 'dark');
    const expandBtn = document.querySelector('button[title*="Expand sidebar"], button[aria-label*="Expand sidebar"]');
    if (expandBtn) expandBtn.click();
    const buttons = Array.from(document.querySelectorAll('button'));
    const hubBtn = buttons.find(b => b.textContent && b.textContent.includes('Command Center'));
    if (hubBtn) hubBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('Capturing: dark_expanded_command_center.png');
  await page.screenshot({
    path: path.join(artifactDir, 'dark_expanded_command_center.png')
  });

  // 7. DARK THEME - Switch to Integrity Desk
  console.log('7. Switching to Integrity Desk in dark theme...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Integrity Desk'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('Capturing: dark_expanded_integrity_desk.png');
  await page.screenshot({
    path: path.join(artifactDir, 'dark_expanded_integrity_desk.png')
  });

  // 8. DARK THEME - Collapsed Rail (72px)
  console.log('8. Collapsing sidebar in dark theme...');
  await page.evaluate(() => {
    const collapseBtn = document.querySelector('button[title*="Collapse sidebar"], button[aria-label*="Collapse sidebar"]');
    if (collapseBtn) collapseBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Capturing: dark_collapsed.png');
  await page.screenshot({
    path: path.join(artifactDir, 'dark_collapsed.png')
  });

  // 9. MOBILE VIEW - Dark Slide-over Drawer
  console.log('9. Resizing to mobile viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 600));

  console.log('Opening mobile drawer...');
  await page.evaluate(() => {
    const menuBtn = document.getElementById('mobile-menu-toggle');
    if (menuBtn) menuBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Capturing: mobile_drawer_open_dark.png');
  await page.screenshot({
    path: path.join(artifactDir, 'mobile_drawer_open_dark.png')
  });

  // 10. MOBILE VIEW - Light Slide-over Drawer
  console.log('10. Switching to light mode in mobile drawer...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('arenadb_theme_mode', 'light');
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Capturing: mobile_drawer_open_light.png');
  await page.screenshot({
    path: path.join(artifactDir, 'mobile_drawer_open_light.png')
  });

  await browser.close();
  console.log('\nAll 10 verification screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
