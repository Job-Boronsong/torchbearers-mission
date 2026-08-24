import { expect, test } from '@playwright/test';
import type { Request, Response } from '@playwright/test';

const homepageApiPaths = new Set(['/api/home/']);

const isHomepageApiRequest = (request: Request) => {
  const url = new URL(request.url());
  return url.origin === 'http://127.0.0.1:4173' && homepageApiPaths.has(url.pathname);
};

const isHomepageApiResponse = (response: Response) => isHomepageApiRequest(response.request());

test('homepage content loads from the Django API', async ({ page }) => {
  const failedApiRequests: string[] = [];
  const failedApiResponses: string[] = [];

  page.on('requestfailed', (request) => {
    if (isHomepageApiRequest(request)) {
      failedApiRequests.push(
        `${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown failure'})`,
      );
    }
  });

  page.on('response', (response) => {
    if (isHomepageApiResponse(response) && response.status() >= 400) {
      failedApiResponses.push(`${response.url()} (HTTP ${response.status()})`);
    }
  });

  const homeResponsePromise = page.waitForResponse(
    (response) => isHomepageApiResponse(response) && new URL(response.url()).pathname === '/api/home/',
  );
  await page.goto('/');

  const homeResponse = await homeResponsePromise;
  expect(homeResponse.status(), 'homepage content API request failed').toBe(200);

  const homeData = await homeResponse.json();
  expect(homeData).toEqual(
    expect.objectContaining({
      slides: expect.any(Array),
      featured_projects: expect.any(Array),
      featured_blogs: expect.any(Array),
    }),
  );

  expect(homeData.slides, 'homepage API returned no hero content').not.toHaveLength(0);
  const [heroSlide] = homeData.slides;
  expect(heroSlide.id, 'homepage API returned an unsaved hero slide').toBeGreaterThan(0);
  const expectedHeroTitle = heroSlide.title;
  const expectedHeroSubtitle = heroSlide.subtitle;
  expect(expectedHeroTitle, 'homepage API returned an empty hero title').toBeTruthy();
  expect(expectedHeroSubtitle, 'homepage API returned an empty hero subtitle').toBeTruthy();
  await expect(
    page.getByRole('heading', { level: 1, name: expectedHeroTitle }),
    'homepage hero content did not render',
  ).toBeVisible();
  await expect(
    page.getByText(expectedHeroSubtitle, { exact: true }),
    'homepage hero subtitle did not render',
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Join the Mission' }),
    'homepage call-to-action content did not render',
  ).toBeVisible();

  expect(failedApiRequests, 'homepage API requests failed').toEqual([]);
  expect(failedApiResponses, 'homepage API responses returned errors').toEqual([]);
});