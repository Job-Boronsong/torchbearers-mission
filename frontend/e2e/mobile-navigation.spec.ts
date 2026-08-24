import { expect, test } from '@playwright/test';
import type { Request } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

const isFrontendAssetRequest = (request: Request) => {
  const url = new URL(request.url());

  if (url.origin !== 'http://127.0.0.1:4173') {
    return false;
  }

  return (
    url.pathname === '/' ||
    url.pathname === '/logo.png' ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/icons.svg' ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/assets/')
  );
};

const isExpectedThirdPartyIframeAbort = (request: Request) => {
  const failure = request.failure();
  const url = new URL(request.url());

  return (
    request.resourceType() === 'document' &&
    url.origin !== 'http://127.0.0.1:4173' &&
    failure?.errorText === 'net::ERR_ABORTED'
  );
};

test('mobile navigation opens and closes with the correct icons', async ({ page }) => {
  const failedFrontendAssets: string[] = [];
  const unexpectedFailedRequests: string[] = [];
  const frontendRuntimeErrors: string[] = [];

  page.on('requestfailed', (request) => {
    if (
      request.frame() !== page.mainFrame() &&
      isExpectedThirdPartyIframeAbort(request)
    ) {
      return;
    }

    const failure = `${request.url()} (${request.failure()?.errorText ?? 'unknown failure'})`;
    if (isFrontendAssetRequest(request)) {
      failedFrontendAssets.push(failure);
    } else {
      unexpectedFailedRequests.push(failure);
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 400 && isFrontendAssetRequest(response.request())) {
      failedFrontendAssets.push(`${response.url()} (HTTP ${response.status()})`);
    }
  });

  page.on('pageerror', (error) => {
    frontendRuntimeErrors.push(error.message);
  });

  await page.goto('/');

  const closedMobileToggle = page.getByRole('button', { name: 'Open navigation menu' });
  const mobileNavigation = page.getByRole('navigation', { name: 'Mobile navigation' });

  await expect(closedMobileToggle).toBeVisible();
  await expect(closedMobileToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(closedMobileToggle.locator('svg.lucide-menu')).toBeVisible();
  await expect(closedMobileToggle.locator('svg.lucide-x')).toHaveCount(0);
  await expect(mobileNavigation).toHaveCount(0);

  await closedMobileToggle.click();
  const openMobileToggle = page.getByRole('button', { name: 'Close navigation menu' });
  await expect(openMobileToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(openMobileToggle.locator('svg.lucide-x')).toBeVisible();
  await expect(openMobileToggle.locator('svg.lucide-menu')).toHaveCount(0);
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByRole('link', { name: 'About Us' })).toBeVisible();

  await openMobileToggle.click();
  await expect(closedMobileToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(closedMobileToggle.locator('svg.lucide-menu')).toBeVisible();
  await expect(closedMobileToggle.locator('svg.lucide-x')).toHaveCount(0);
  await expect(mobileNavigation).toHaveCount(0);

  expect(failedFrontendAssets, 'frontend bundle, logo, or icon assets failed to load').toEqual([]);
  expect(frontendRuntimeErrors, 'frontend runtime errors were reported').toEqual([]);
  expect(unexpectedFailedRequests, 'unexpected browser requests failed').toEqual([]);
});