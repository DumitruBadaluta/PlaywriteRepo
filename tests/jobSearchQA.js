import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const reportPath = path.resolve(process.cwd(), 'jobSearchQA-report.csv');

function escapeCsv(value) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ');
  return `"${text.replace(/"/g, '""')}"`;
}

function parseRelativeAge(value) {
  const text = String(value ?? '').toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)/);
  const amount = match ? Number(match[1]) : 999999;

  if (text.includes('hour')) return amount;
  if (text.includes('day')) return amount * 24;
  if (text.includes('week')) return amount * 24 * 7;
  if (text.includes('month')) return amount * 24 * 30;
  if (text.includes('year')) return amount * 24 * 365;
  return 999999;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  await page.goto('https://www.linkedin.com/', { waitUntil: 'domcontentloaded' });

  const jobsButton = page.locator('a[href*="/jobs/"]').filter({ hasText: /Jobs/i }).first();
  try {
    await jobsButton.waitFor({ state: 'visible', timeout: 15000 });
    await jobsButton.click();
  } catch {
    await page.goto('https://www.linkedin.com/jobs/', { waitUntil: 'domcontentloaded' });
  }
  await page.waitForURL(/linkedin\.com\/jobs\//, { timeout: 20000 });

  const keywordInput = page.locator('input[aria-label="Search job titles or companies"]').first();
  const locationInput = page.locator('input[aria-label="Location"]').first();

  await keywordInput.fill('qa remote');
  await locationInput.fill('Romania');
  await page.keyboard.press('Enter');

  const datePostedFilter = page.getByRole('button', { name: /Date posted/i }).first();
  if (await datePostedFilter.count()) {
    await datePostedFilter.click();
  }

  const past24HoursFilter = page.getByRole('button', { name: /Past 24 hours/i }).first();
  if (await past24HoursFilter.count()) {
    await past24HoursFilter.click();
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
  await fs.writeFile(reportPath, csvContent, 'utf8');

  console.log('CSV report created:');
  console.log(csvContent);
  console.log(`\nReport saved to: ${reportPath}`);

  await browser.close();
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
