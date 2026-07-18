// 사용자 매뉴얼 삽화 캡처 — 390×844@2x(780×1688). 데모 모드 + PIN 1234.
// 홈 계열은 데모 배지 숨김(실사용 외형). 숨김 화면은 5s 롱프레스 재현.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = 'http://localhost:4173';
const OUT = './manual-shots';
fs.mkdirSync(OUT, { recursive: true });
const VP = { width: 390, height: 844 };

const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function newAppPage(theme = 'dark') {
  const ctx = await browser.newContext({
    viewport: VP, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR',
  });
  await ctx.addInitScript(({ theme }) => {
    localStorage.setItem('doori.net', JSON.stringify({ demoMode: true }));
    localStorage.setItem('doori.lang', 'ko');
    localStorage.setItem('doori.theme', theme);
  }, { theme });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200); // 시작 화면(~1.4s) 지나감
  return page;
}

const hideBadge = (page) => page.evaluate(() => {
  const s = [...document.querySelectorAll('span')].find((x) => x.textContent === '데모 모드');
  if (s) s.closest('div').style.display = 'none';
});

async function connectDemo(page) {
  await page.getByRole('button', { name: '연결', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).waitFor({ timeout: 8000 });
  for (const d of ['1', '2', '3', '4']) {
    await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(120);
  }
  await page.getByText('기본 제어').waitFor({ timeout: 10000 });
  await page.waitForTimeout(600);
}

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });
const back = async (page) => { await page.mouse.click(30, 44); await page.waitForTimeout(500); };

async function longPress(page, locator, ms = 5600) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
  await page.waitForTimeout(600);
}

// ===== 메인 플로우(다크) =====
let page = await newAppPage('dark');
await shot(page, 'm01-home-offline');

await page.getByRole('button', { name: '연결', exact: true }).click();
await page.getByRole('button', { name: '1', exact: true }).waitFor({ timeout: 8000 });
await page.waitForTimeout(400);
await shot(page, 'm02-pin');
for (const d of ['1', '2', '3', '4']) {
  await page.getByRole('button', { name: d, exact: true }).click();
  await page.waitForTimeout(120);
}
await page.getByText('기본 제어').waitFor({ timeout: 10000 });
await page.waitForTimeout(600);
await hideBadge(page);
await shot(page, 'm03-home');

// 열림 — 센서 점등
await page.getByRole('button', { name: '열림', exact: true }).click();
await page.waitForTimeout(700);
await hideBadge(page);
await shot(page, 'm04-open');
await page.waitForTimeout(6000); // 자동 닫힘 대기

// 설정 메뉴
await page.mouse.click(VP.width - 32, 40);
await page.getByText('네트워크 설정').waitFor({ timeout: 5000 });
await page.waitForTimeout(400);
await shot(page, 'm05-settings');

// 네트워크 설정(기본) — 자동 검색 켜고 예시 입력
await page.getByText('네트워크 설정', { exact: true }).click();
await page.getByText('WiFi 자동 검색').waitFor({ timeout: 5000 });
await page.waitForTimeout(400);
// 토글 켜기(행 우측 스위치) — 행 클릭으로 토글되는지 먼저 시도
const autoRow = page.getByText('WiFi 자동 검색');
const rowBox = await autoRow.boundingBox();
await page.mouse.click(VP.width - 50, rowBox.y + rowBox.height / 2);
await page.waitForTimeout(500);
const nameInput = page.locator('input').first();
if (await page.locator('input').count()) {
  await nameInput.fill('WizFi360_123456');
  await page.waitForTimeout(300);
}
await shot(page, 'm06-network');
await back(page);
// 미저장 확인 팝업이 뜨면 '저장 안 함'
try { await page.getByText('저장 안 함').click({ timeout: 1500 }); } catch {}
await page.waitForTimeout(400);

// 네트워크 상세(숨김) — 롱프레스
await longPress(page, page.getByText('네트워크 설정', { exact: true }));
try {
  await page.getByText('네트워크 상세 설정').waitFor({ timeout: 3000 });
  await page.waitForTimeout(400);
  await shot(page, 'm07-network-adv');
  await back(page);
  try { await page.getByText('저장 안 함').click({ timeout: 1500 }); } catch {}
} catch { console.warn('[warn] network-adv longpress failed'); }
await page.waitForTimeout(400);

// 자동문 설정 — 진입 시 자동 읽기
await page.getByText('자동문 설정', { exact: true }).click();
await page.getByText('OPEN SPEED').waitFor({ timeout: 8000 });
await page.waitForTimeout(1500); // 읽기 완료 대기
await shot(page, 'm08-door-settings');
await back(page);
await page.waitForTimeout(400);

// 패스워드 설정 — 1단계(현재 비밀번호)
await page.getByText('패스워드 설정', { exact: true }).click();
await page.waitForTimeout(800);
await shot(page, 'm09-password');
await back(page);
await page.waitForTimeout(400);

// 화면 설정
await page.getByText('화면 설정', { exact: true }).click();
await page.getByText('어두운 테마').waitFor({ timeout: 5000 });
await page.waitForTimeout(400);
await shot(page, 'm10-display');
await back(page);
await page.waitForTimeout(400);

// 사용 기록
await page.getByText('사용 기록', { exact: true }).first().click();
await page.getByText(/전체|기록이 없습니다/).first().waitFor({ timeout: 5000 });
await page.waitForTimeout(400);
await shot(page, 'm11-history');
await page.context().close();

// ===== 테마 예시(라이트/화이트 홈) =====
for (const [theme, name] of [['light', 'm12-home-light'], ['white', 'm13-home-white']]) {
  page = await newAppPage(theme);
  await connectDemo(page);
  await hideBadge(page);
  await shot(page, name);
  await page.context().close();
}
console.log('DONE');
await browser.close();
