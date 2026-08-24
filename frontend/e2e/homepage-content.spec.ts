import { expect, test } from '@playwright/test';
import type { Request, Response } from '@playwright/test';

const homepageApiPaths = new Set(['/api/home/']);

const isHomepageApiRequest = (request: Request) => {
  const url = new URL(request.url());
  return url.origin === 'http://127.0.0.1:4173' && homepageApiPaths.has(url.pathname);
};

const isHomepageApiResponse = (response: Response) => isHomepageApiRequest(response.request());

test('homepage content loads from the Django API', async ({ page }) => {
  let homepageRequests = 0;
  const failedApiRequests: string[] = [];
  const failedApiResponses: string[] = [];

  page.on('request', (request) => {
    if (isHomepageApiRequest(request)) {
      homepageRequests += 1;
    }
  });

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
  expect(homepageRequests, 'homepage content should be requested once initially').toBe(1);

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

test('public navigation prefetches a first visit before navigation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        saveData: true,
      },
    });
    (window as unknown as { idleCallbackScheduled?: boolean }).idleCallbackScheduled = false;
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: () => {
        (window as unknown as { idleCallbackScheduled?: boolean }).idleCallbackScheduled = true;
        return 1;
      },
    });

    const routeLoadingSelector = '[role="status"][aria-label="Loading page"]';
    (window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen = false;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE
            && ((node as Element).matches(routeLoadingSelector)
              || (node as Element).querySelector(routeLoadingSelector))
          ) {
            (window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen = true;
            return;
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });

  await page.goto('/');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { idleCallbackScheduled?: boolean }).idleCallbackScheduled)),
    'Save-Data should suppress background route prefetching',
  ).toBe(false);
  const aboutLink = page.getByRole('banner').getByRole('link', { name: 'About Us', exact: true });
  const aboutChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/About.tsx'),
  );
  await aboutLink.hover();
  await aboutChunkRequest;

  const blogLink = page.getByRole('banner').getByRole('link', { name: 'Blog', exact: true });
  const blogChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/Blog.tsx'),
  );
  await blogLink.focus();
  await blogChunkRequest;

  await aboutLink.click();
  await expect(page).toHaveURL('/about');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'a prefetched public route should not show the generic route-code fallback',
  ).toBe(false);
  await expect(page.getByRole('heading', { level: 1, name: 'About Us' })).toBeVisible();
});

const cachedHomepageBody = {
  slides: [{
    id: 1,
    title: 'Cached Home',
    subtitle: 'Loaded without waiting.',
    image: null,
    button_text: '',
    button_link: '',
    layout: 'center',
  }],
  featured_projects: [],
  featured_blogs: [],
  total_donations: '0',
  donor_count: 0,
};

test('homepage reuses fresh cached content after returning to the page', async ({ page }) => {
  let homepageRequests = 0;

  await page.route('**/api/home/', async (route) => {
    homepageRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cachedHomepageBody),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Cached Home' })).toBeVisible();

  await page.getByRole('banner').getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page).toHaveURL('/contact');
  await page.getByRole('banner').getByRole('link', { name: 'Home', exact: true }).click();

  await expect(page.getByRole('status', { name: 'Loading homepage' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Cached Home' })).toBeVisible();
  expect(homepageRequests, 'fresh homepage content should be reused on return').toBe(1);
});

test('homepage reuses fresh cached content after a browser refresh', async ({ page }) => {
  let homepageRequests = 0;

  await page.addInitScript(() => {
    const routeLoadingSelector = '[role="status"][aria-label="Loading page"]';
    (window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen = false;

    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE
            && ((node as Element).matches(routeLoadingSelector)
              || (node as Element).querySelector(routeLoadingSelector))
          ) {
            (window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen = true;
            return;
          }
        }
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  });

  await page.route('**/api/home/', async (route) => {
    homepageRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cachedHomepageBody),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Cached Home' })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('status', { name: 'Loading homepage' })).toHaveCount(0);
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'fresh cached content should be mounted without the route-code loading fallback',
  ).toBe(false);
  await expect(page.getByRole('heading', { level: 1, name: 'Cached Home' })).toBeVisible();
  expect(homepageRequests, 'fresh homepage content should be reused after refresh').toBe(1);
});

const cachedPublicPageCases = [
  {
    name: 'about page',
    path: '/about',
    apiPath: '**/api/about/',
    heading: 'About Us',
    body: {
      mission_vision: {
        hero_image: null,
        hero_title: 'About Us',
        hero_subtitle: 'Our story',
        vision_and_purpose: '',
        statement_of_faith: '',
      },
      who_we_are: { title: 'Who We Are', content: '' },
      director_message: null,
      team: [],
    },
  },
  {
    name: 'projects page',
    path: '/projects',
    apiPath: '**/api/projects/',
    heading: 'Our Projects',
    body: { projects: [] },
  },
  {
    name: 'blog page',
    path: '/blog',
    apiPath: '**/api/blog/',
    heading: 'Our Blog',
    body: { posts: [] },
  },
] as const;

for (const pageCase of cachedPublicPageCases) {
  test(`${pageCase.name} refresh distinguishes route-code and CMS loading`, async ({ page }) => {
    let contentRequests = 0;

    await page.addInitScript(() => {
      const routeLoadingSelector = '[role="status"][aria-label="Loading page"]';
      (window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen = false;

      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (
              node.nodeType === Node.ELEMENT_NODE
              && ((node as Element).matches(routeLoadingSelector)
                || (node as Element).querySelector(routeLoadingSelector))
            ) {
              (window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen = true;
              return;
            }
          }
        }
      });

      observer.observe(document.documentElement, { childList: true, subtree: true });
    });

    await page.route(pageCase.apiPath, async route => {
      contentRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pageCase.body),
      });
    });

    await page.goto(pageCase.path);
    await expect(page.getByRole('heading', { level: 1, name: pageCase.heading })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('status', { name: /Loading (about page|projects|blog)/ })).toHaveCount(0);
    expect(
      await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
      'fresh cached content should be mounted without the route-code loading fallback',
    ).toBe(false);
    await expect(page.getByRole('heading', { level: 1, name: pageCase.heading })).toBeVisible();
    expect(contentRequests, 'fresh public content should be reused after refresh').toBe(1);
  });
}

test('homepage refreshes cached content after its freshness window expires', async ({ page }) => {
  let homepageRequests = 0;

  await page.clock.install();
  await page.route('**/api/home/', async (route) => {
    homepageRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...cachedHomepageBody,
        slides: [{
          ...cachedHomepageBody.slides[0],
          title: homepageRequests === 1 ? 'Cached Home' : 'Refreshed Home',
        }],
      }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Cached Home' })).toBeVisible();

  await page.clock.fastForward(30_001);
  await page.getByRole('banner').getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page).toHaveURL('/contact');
  const refreshedResponsePromise = page.waitForResponse(
    (response) =>
      isHomepageApiResponse(response) &&
      response.status() === 200 &&
      new URL(response.url()).pathname === '/api/home/',
  );
  await page.getByRole('banner').getByRole('link', { name: 'Home', exact: true }).click();
  await refreshedResponsePromise;

  await expect(page.getByRole('heading', { level: 1, name: 'Refreshed Home' })).toBeVisible();
  expect(homepageRequests, 'expired homepage content should be requested again').toBe(2);
});

test('homepage API errors show a retry state without hiding the footer', async ({ page }) => {
  let homepageRequests = 0;

  await page.route('**/api/home/', async (route) => {
    homepageRequests += 1;
    if (homepageRequests === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' }),
      });
      return;
    }

    await route.continue();
  });

  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'We couldn’t load the homepage' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Please try again.');
  const footer = page.getByRole('contentinfo');
  await expect(footer).toBeVisible();
  await expect(footer.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  expect(homepageRequests, 'homepage content should be requested once initially').toBe(1);
  expect(
    await page.evaluate(() => window.localStorage.getItem('public-content-cache')),
    'failed homepage responses should not be persisted',
  ).toBeNull();

  const retryResponsePromise = page.waitForResponse(
    (response) =>
      isHomepageApiResponse(response) &&
      new URL(response.url()).pathname === '/api/home/' &&
      response.status() === 200,
  );
  await page.getByRole('button', { name: 'Try again' }).click();
  await retryResponsePromise;

  await expect(page.getByRole('heading', { name: 'Join the Mission' })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: 'We couldn’t load the homepage' }),
  ).toHaveCount(0);
});

test('footer contact details can be retried without hiding footer navigation', async ({ page }) => {
  let footerRequests = 0;

  await page.route('**/api/footer/', async (route) => {
    footerRequests += 1;

    if (footerRequests === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        address: '12 Mission Avenue',
        email: 'hello@example.org',
        phone: '+233 20 000 0000',
        whatsapp: null,
        facebook: null,
        twitter: null,
        linkedin: null,
        map_embed: null,
      }),
    });
  });

  await page.goto('/');

  const footer = page.getByRole('contentinfo');
  await expect(
    footer.getByRole('alert'),
  ).toContainText('We couldn’t load our contact details. Please try again.');
  expect(footerRequests, 'initial footer loads should share one request').toBe(1);
  await expect(footer.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  await expect(footer.getByRole('heading', { name: 'Our Location' })).toBeVisible();
  await expect(footer.getByTitle('Torchbearers Mission Location')).toBeVisible();

  await footer.getByRole('button', { name: 'Try again' }).click();

  await expect(footer.getByRole('link', { name: 'hello@example.org' })).toBeVisible();
  await expect(footer.getByText('12 Mission Avenue', { exact: true })).toBeVisible();
  await expect(footer.getByRole('alert')).toHaveCount(0);
});
