import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test.use({
  locale: 'en-US',
  timezoneId: 'UTC',
});

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportPath = path.resolve(process.cwd(), `jobSearchQA-report-${timestamp}.csv`);

async function writeCsvWithRetry(filePath, csvContent, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.writeFile(filePath, csvContent, 'utf8');
      return;
    } catch (error) {
      if (error && error.code !== 'EBUSY' || attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

function escapeCsv(value) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ');
  return `"${text.replace(/"/g, '""')}"`;
}

function parseRelativeAge(value) {
  const text = String(value ?? '').toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)/);
  const amount = match ? Number(match[1]) : 999999;

  if (text.includes('minute') || text.includes('min')) return amount / 60;
  if (text.includes('hour')) return amount;
  if (text.includes('day')) return amount * 24;
  if (text.includes('week')) return amount * 24 * 7;
  if (text.includes('month')) return amount * 24 * 30;
  if (text.includes('year')) return amount * 24 * 365;
  return 999999;
}

test('job search QA', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium', 'LinkedIn guest search is run once in desktop Chromium');

  await page.goto('https://www.linkedin.com/jobs/search/?keywords=qa%20remote&location=Romania&f_TPR=r86400', {
    waitUntil: 'domcontentloaded',
  });

  const acceptCookies = page.getByRole('button', { name: 'Accept', exact: true });
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click();
  }

  if (!new URL(page.url()).pathname.startsWith('/jobs/search')) {
    test.skip(true, 'LinkedIn redirected the guest search away from job results');
  }

  await page.waitForFunction(
    () => document.querySelectorAll('a[href*="/jobs/view/"]').length > 0,
    { timeout: 20000 }
  );

  const rows = await page.locator('li').evaluateAll((items) => {
    const results = [];
    const seen = new Set();

    for (const item of items) {
      const titleLink = item.querySelector('a[href*="/jobs/view/"]');
      const companyEl = item.querySelector('a[href*="/company/"]');
      const dateEl = item.querySelector('time, .job-search-card__listdate, .job-search-card__date, .job-card-container__metadata-item');
      if (!titleLink) continue;

      const link = titleLink.href;
      const title = titleLink.textContent?.trim() || 'Unknown';
      const company = companyEl?.textContent?.trim() || 'Unknown';
      const postDate = dateEl?.textContent?.trim() || 'Unknown';
      const key = `${company}|||${title}|||${link}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ postDate, company, title, link });
    }

    return results;
  });

  rows.sort((a, b) => parseRelativeAge(a.postDate) - parseRelativeAge(b.postDate));

  const csvLines = [
    'Post Date,Company,Job title,link',
    ...rows.map(({ postDate, company, title, link }) =>
      [escapeCsv(postDate), escapeCsv(company), escapeCsv(title), escapeCsv(link)].join(',')
    ),
  ];

  const csvContent = `${csvLines.join('\n')}\n`;
  await writeCsvWithRetry(reportPath, csvContent);

  console.log('CSV report created:');
  console.log(csvContent);
  console.log(`\nReport saved to: ${reportPath}`);
});
