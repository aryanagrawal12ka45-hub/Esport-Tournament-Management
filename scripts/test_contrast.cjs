// scripts/test_contrast.cjs
// Automated WCAG 2.1 AA Contrast Ratio Verification Suite for Broadcast and Arena Themes

function parseHex(hex) {
  hex = hex.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function sRGBtoLin(colorChannel) {
  const c = colorChannel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getLuminance(hex) {
  const rgb = parseHex(hex);
  const r = sRGBtoLin(rgb.r);
  const g = sRGBtoLin(rgb.g);
  const b = sRGBtoLin(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Token dictionaries from tokens.css
const BROADCAST_THEME = {
  name: 'Broadcast (Light)',
  tokens: {
    surface: '#FFFFFF',
    surface2: '#F8FAFC',
    surface3: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#475569',
    primary: '#1D4ED8',
    textOnPrimary: '#FFFFFF',
    success: '#15803D',
    warning: '#B45309',
    danger: '#DC2626',
    info: '#0284C7',
    live: '#DC2626'
  }
};

const ARENA_THEME = {
  name: 'Arena (Dark)',
  tokens: {
    surface: '#0B111E',
    surface2: '#0F172A',
    surface3: '#1E293B',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    primary: '#38BDF8',
    textOnPrimary: '#061122',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#38BDF8',
    live: '#F87171'
  }
};

const PAIRS_TO_TEST = [
  { fg: 'text', bg: 'surface', min: 4.5, desc: 'Body text on main surface' },
  { fg: 'text', bg: 'surface2', min: 4.5, desc: 'Body text on secondary surface' },
  { fg: 'textMuted', bg: 'surface', min: 4.5, desc: 'Muted captions/subtitles on surface' },
  { fg: 'textMuted', bg: 'surface2', min: 4.5, desc: 'Muted captions/subtitles on surface-2' },
  { fg: 'textOnPrimary', bg: 'primary', min: 4.5, desc: 'Button / active text on primary' },
  { fg: 'primary', bg: 'surface', min: 3.0, desc: 'Primary brand elements on surface' },
  { fg: 'success', bg: 'surface', min: 3.0, desc: 'Success indicators on surface' },
  { fg: 'warning', bg: 'surface', min: 3.0, desc: 'Warning indicators on surface' },
  { fg: 'danger', bg: 'surface', min: 3.0, desc: 'Danger indicators on surface' },
  { fg: 'info', bg: 'surface', min: 3.0, desc: 'Info indicators on surface' },
  { fg: 'live', bg: 'surface', min: 3.0, desc: 'Live HUD indicators on surface' },
];

let totalPassed = 0;
let totalFailed = 0;

console.log('========================================================');
console.log(' WCAG 2.1 AA COLOR CONTRAST RATIO VERIFICATION SUITE');
console.log('========================================================\n');

[BROADCAST_THEME, ARENA_THEME].forEach(theme => {
  console.log(`--- Theme: ${theme.name} ---`);
  PAIRS_TO_TEST.forEach(test => {
    const fgHex = theme.tokens[test.fg];
    const bgHex = theme.tokens[test.bg];
    const ratio = getContrastRatio(fgHex, bgHex);
    const passed = ratio >= test.min;
    
    if (passed) {
      totalPassed++;
      console.log(`  [PASS] ${test.desc.padEnd(42)} (${test.fg} on ${test.bg}): ${ratio.toFixed(2)}:1 (min ${test.min}:1)`);
    } else {
      totalFailed++;
      console.error(`  [FAIL] ${test.desc.padEnd(42)} (${test.fg} on ${test.bg}): ${ratio.toFixed(2)}:1 (REQUIRED ${test.min}:1)`);
    }
  });
  console.log('');
});

const SIDEBAR_THEMES = [
  {
    name: 'Sidebar - Broadcast (Light)',
    bgGradient: [
      { point: 'gradient-top', hex: '#0B2233' },
      { point: 'gradient-mid', hex: '#0E2D45' },
      { point: 'gradient-bot', hex: '#0A2A3C' }
    ],
    tokens: {
      text: '#D3DFEA',
      textMuted: '#94AABD',
      activeBg: '#22D3EE',
      activeText: '#04222A',
      activeBar: '#FFFFFF',
      simActiveText: '#34D399'
    }
  },
  {
    name: 'Sidebar - Arena (Dark)',
    bgGradient: [
      { point: 'gradient-top', hex: '#121A3A' },
      { point: 'gradient-mid', hex: '#0F1730' },
      { point: 'gradient-bot', hex: '#0C1226' }
    ],
    tokens: {
      text: '#DCE4F2',
      textMuted: '#97A6C4',
      activeBg: '#22D3EE',
      activeText: '#04222A',
      activeBar: '#A78BFA',
      simActiveText: '#34D399'
    }
  }
];

console.log('--- Sidebar Dedicated Token Verification (Step 4) ---');
SIDEBAR_THEMES.forEach(sb => {
  console.log(`\nTheme: ${sb.name}`);

  // Test active text on cyan active-bg
  const activeRatio = getContrastRatio(sb.tokens.activeText, sb.tokens.activeBg);
  const activePass = activeRatio >= 4.5;
  if (activePass) {
    totalPassed++;
    console.log(`  [PASS] Active item text on active-bg (${sb.tokens.activeText} on ${sb.tokens.activeBg}): ${activeRatio.toFixed(2)}:1 (min 4.5:1)`);
  } else {
    totalFailed++;
    console.error(`  [FAIL] Active item text on active-bg: ${activeRatio.toFixed(2)}:1 (REQUIRED 4.5:1)`);
  }

  // Test text & muted text on all points of gradient
  sb.bgGradient.forEach(bg => {
    // Normal text >= 4.5:1
    const textRatio = getContrastRatio(sb.tokens.text, bg.hex);
    if (textRatio >= 4.5) {
      totalPassed++;
      console.log(`  [PASS] Sidebar text on ${bg.point} (${sb.tokens.text} on ${bg.hex}): ${textRatio.toFixed(2)}:1 (min 4.5:1)`);
    } else {
      totalFailed++;
      console.error(`  [FAIL] Sidebar text on ${bg.point}: ${textRatio.toFixed(2)}:1 (REQUIRED 4.5:1)`);
    }

    // Muted text >= 4.5:1
    const mutedRatio = getContrastRatio(sb.tokens.textMuted, bg.hex);
    if (mutedRatio >= 4.5) {
      totalPassed++;
      console.log(`  [PASS] Muted text on ${bg.point} (${sb.tokens.textMuted} on ${bg.hex}): ${mutedRatio.toFixed(2)}:1 (min 4.5:1)`);
    } else {
      totalFailed++;
      console.error(`  [FAIL] Muted text on ${bg.point}: ${mutedRatio.toFixed(2)}:1 (REQUIRED 4.5:1)`);
    }

    // Icons >= 3.0:1
    if (mutedRatio >= 3.0) {
      totalPassed++;
      console.log(`  [PASS] Sidebar icon on ${bg.point} (${sb.tokens.textMuted} on ${bg.hex}): ${mutedRatio.toFixed(2)}:1 (min 3.0:1)`);
    } else {
      totalFailed++;
      console.error(`  [FAIL] Sidebar icon on ${bg.point}: ${mutedRatio.toFixed(2)}:1 (REQUIRED 3.0:1)`);
    }

    // Simulation active indicator >= 4.5:1
    const simRatio = getContrastRatio(sb.tokens.simActiveText, bg.hex);
    if (simRatio >= 4.5) {
      totalPassed++;
      console.log(`  [PASS] Sim active text on ${bg.point} (${sb.tokens.simActiveText} on ${bg.hex}): ${simRatio.toFixed(2)}:1 (min 4.5:1)`);
    } else {
      totalFailed++;
      console.error(`  [FAIL] Sim active text on ${bg.point}: ${simRatio.toFixed(2)}:1 (REQUIRED 4.5:1)`);
    }
  });
});

console.log('\n========================================================');
console.log(` SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('========================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
