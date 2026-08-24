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

test('project and blog cards prefetch their matching detail routes before navigation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        saveData: true,
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

  const detailChunkRequests: string[] = [];
  page.on('request', request => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith('/src/pages/ProjectDetail.tsx') || pathname.endsWith('/src/pages/BlogDetail.tsx')) {
      detailChunkRequests.push(pathname);
    }
  });

  await page.route('**/api/projects/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        projects: [{
          id: 101,
          title: 'Clean Water Initiative',
          slug: 'clean-water-initiative',
          feature_image: null,
          created_at: '2026-08-24T00:00:00Z',
          show_donate: false,
        }],
      }),
    });
  });
  await page.route('**/api/projects/clean-water-initiative/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 101,
        title: 'Clean Water Initiative',
        slug: 'clean-water-initiative',
        description: '<p>Clean water for local communities.</p>',
        feature_image: null,
        created_at: '2026-08-24T00:00:00Z',
        show_donate: false,
      }),
    });
  });

  await page.goto('/projects');
  await expect(page.getByRole('heading', { level: 1, name: 'Our Projects' })).toBeVisible();
  const projectLink = page.locator('a[href="/projects/clean-water-initiative"]');
  const projectChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/ProjectDetail.tsx'),
  );
  await projectLink.focus();
  await projectChunkRequest;
  expect(detailChunkRequests).toEqual(['/src/pages/ProjectDetail.tsx']);

  await projectLink.click();
  await expect(page).toHaveURL('/projects/clean-water-initiative');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'a prefetched project detail route should not show the generic route-code fallback',
  ).toBe(false);
  await expect(page.getByRole('heading', { level: 1, name: 'Clean Water Initiative' })).toBeVisible();

  await page.route('**/api/blog/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        posts: [{
          id: 202,
          title: 'A New Chapter',
          slug: 'a-new-chapter',
          feature_image: null,
          seo_description: 'A story from the field.',
          content: '<p>Serving together.</p>',
          created_at: '2026-08-24T00:00:00Z',
        }],
      }),
    });
  });
  await page.route('**/api/blog/a-new-chapter/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 202,
        title: 'A New Chapter',
        slug: 'a-new-chapter',
        feature_image: null,
        seo_description: 'A story from the field.',
        content: '<p>Serving together.</p>',
        created_at: '2026-08-24T00:00:00Z',
      }),
    });
  });

  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1, name: 'Our Blog' })).toBeVisible();
  const blogLink = page.locator('a[href="/blog/a-new-chapter"]');
  const blogChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/BlogDetail.tsx'),
  );
  await blogLink.focus();
  await blogChunkRequest;
  expect(detailChunkRequests).toEqual([
    '/src/pages/ProjectDetail.tsx',
    '/src/pages/BlogDetail.tsx',
  ]);

  await blogLink.click();
  await expect(page).toHaveURL('/blog/a-new-chapter');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'a prefetched blog detail route should not show the generic route-code fallback',
  ).toBe(false);
  await expect(page.getByRole('heading', { level: 1, name: 'A New Chapter' })).toBeVisible();
});

test('homepage project and blog cards prefetch their matching detail routes before navigation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        saveData: true,
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

  const detailChunkRequests: string[] = [];
  page.on('request', request => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith('/src/pages/ProjectDetail.tsx') || pathname.endsWith('/src/pages/BlogDetail.tsx')) {
      detailChunkRequests.push(pathname);
    }
  });

  await page.route('**/api/home/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        slides: [{
          id: 303,
          title: 'Homepage Feature',
          subtitle: 'Stories of impact.',
          image: null,
          button_text: '',
          button_link: '',
          layout: 'center',
        }],
        featured_projects: [{
          id: 304,
          title: 'Homepage Project',
          slug: 'homepage-project',
          feature_image: null,
          created_at: '2026-08-24T00:00:00Z',
          show_donate: false,
        }],
        featured_blogs: [{
          id: 305,
          title: 'Homepage Story',
          slug: 'homepage-story',
          feature_image: null,
          seo_description: 'A homepage story.',
          content: '<p>Serving together.</p>',
          created_at: '2026-08-24T00:00:00Z',
        }],
        total_donations: '0',
        donor_count: 0,
      }),
    });
  });
  await page.route('**/api/projects/homepage-project/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 304,
        title: 'Homepage Project',
        slug: 'homepage-project',
        description: '<p>Impact from the homepage.</p>',
        feature_image: null,
        created_at: '2026-08-24T00:00:00Z',
        show_donate: false,
      }),
    });
  });
  await page.route('**/api/blog/homepage-story/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 305,
        title: 'Homepage Story',
        slug: 'homepage-story',
        feature_image: null,
        seo_description: 'A homepage story.',
        content: '<p>Serving together.</p>',
        created_at: '2026-08-24T00:00:00Z',
      }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Homepage Feature' })).toBeVisible();

  const projectLink = page.locator('a[href="/projects/homepage-project"]');
  const projectChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/ProjectDetail.tsx'),
  );
  await projectLink.focus();
  await projectChunkRequest;
  expect(detailChunkRequests).toEqual(['/src/pages/ProjectDetail.tsx']);

  await projectLink.click();
  await expect(page).toHaveURL('/projects/homepage-project');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'a prefetched homepage project detail route should not show the generic route-code fallback',
  ).toBe(false);
  await expect(page.getByRole('heading', { level: 1, name: 'Homepage Project' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Homepage Feature' })).toBeVisible();

  const blogLink = page.locator('a[href="/blog/homepage-story"]');
  const blogChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/BlogDetail.tsx'),
  );
  await blogLink.hover();
  await blogChunkRequest;
  expect(detailChunkRequests).toEqual([
    '/src/pages/ProjectDetail.tsx',
    '/src/pages/BlogDetail.tsx',
  ]);

  await blogLink.click();
  await expect(page).toHaveURL('/blog/homepage-story');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'a prefetched homepage blog detail route should not show the generic route-code fallback',
  ).toBe(false);
  await expect(page.getByRole('heading', { level: 1, name: 'Homepage Story' })).toBeVisible();
});

test('homepage hero buttons prefetch only their matching public routes before navigation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        saveData: true,
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

  const routeChunkRequests: string[] = [];
  page.on('request', request => {
    const pathname = new URL(request.url()).pathname;
    if (
      pathname.endsWith('/src/pages/About.tsx')
      || pathname.endsWith('/src/pages/ProjectDetail.tsx')
      || pathname.endsWith('/src/pages/Donate.tsx')
      || pathname.endsWith('/src/pages/Volunteer.tsx')
    ) {
      routeChunkRequests.push(pathname);
    }
  });

  await page.route('**/api/home/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        slides: [
          {
            id: 306,
            title: 'About Feature',
            subtitle: 'Learn about the mission.',
            image: null,
            button_text: 'About the Mission',
            button_link: '/about',
            layout: 'center',
          },
          {
            id: 307,
            title: 'Project Feature',
            subtitle: 'Explore the work.',
            image: null,
            button_text: 'Explore the Project',
            button_link: '/projects/hero-project',
            layout: 'center',
          },
          {
            id: 308,
            title: 'Donate Feature',
            subtitle: 'Support the mission.',
            image: null,
            button_text: 'Donate Now',
            button_link: '/donate',
            layout: 'center',
          },
          {
            id: 310,
            title: 'Volunteer Feature',
            subtitle: 'Serve with the mission.',
            image: null,
            button_text: 'Volunteer With Us',
            button_link: '/volunteer',
            layout: 'center',
          },
          {
            id: 311,
            title: 'Unsupported Feature',
            subtitle: 'A route without a public loader.',
            image: null,
            button_text: 'Open Unsupported Route',
            button_link: '/unknown',
            layout: 'center',
          },
        ],
        featured_projects: [],
        featured_blogs: [],
        total_donations: '0',
        donor_count: 0,
      }),
    });
  });
  await page.route('**/api/projects/hero-project/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 309,
        title: 'Hero Project',
        slug: 'hero-project',
        description: '<p>Impact from the hero.</p>',
        feature_image: null,
        created_at: '2026-08-24T00:00:00Z',
        show_donate: false,
      }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'About Feature' })).toBeVisible();

  const heroSection = page.locator('section').first();
  const aboutButton = page.getByRole('link', { name: 'About the Mission' });
  const aboutChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/About.tsx'),
  );
  await aboutButton.focus();
  await aboutChunkRequest;
  expect(routeChunkRequests).toEqual(['/src/pages/About.tsx']);

  await aboutButton.click();
  await expect(page).toHaveURL('/about');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'a prefetched hero route should not show the generic route-code fallback',
  ).toBe(false);

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'About Feature' })).toBeVisible();
  await heroSection.getByRole('button').nth(1).click();
  const projectButton = page.getByRole('link', { name: 'Explore the Project' });
  await expect(projectButton).toBeVisible();
  const projectChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/ProjectDetail.tsx'),
  );
  await projectButton.hover();
  await projectChunkRequest;
  expect(routeChunkRequests).toEqual([
    '/src/pages/About.tsx',
    '/src/pages/ProjectDetail.tsx',
  ]);

  await projectButton.click();
  await expect(page).toHaveURL('/projects/hero-project');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'a prefetched hero detail route should not show the generic route-code fallback',
  ).toBe(false);
  await expect(page.getByRole('heading', { level: 1, name: 'Hero Project' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'About Feature' })).toBeVisible();
  await heroSection.getByRole('button').nth(1).click();
  await heroSection.getByRole('button').nth(1).click();
  const donateButton = page.getByRole('link', { name: 'Donate Now' });
  await expect(donateButton).toBeVisible();
  const donateChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/Donate.tsx'),
  );
  await donateButton.focus();
  await donateChunkRequest;
  expect(routeChunkRequests).toEqual([
    '/src/pages/About.tsx',
    '/src/pages/ProjectDetail.tsx',
    '/src/pages/Donate.tsx',
  ]);

  await donateButton.click();
  await expect(page).toHaveURL('/donate');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'a prefetched donate route should not show the generic route-code fallback',
  ).toBe(false);
  await expect(page.getByRole('heading', { level: 1, name: 'Support the Mission' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'About Feature' })).toBeVisible();
  await heroSection.getByRole('button').nth(1).click();
  await heroSection.getByRole('button').nth(1).click();
  await heroSection.getByRole('button').nth(1).click();
  const volunteerButton = page.getByRole('link', { name: 'Volunteer With Us' });
  await expect(volunteerButton).toBeVisible();
  const volunteerChunkRequest = page.waitForRequest(
    request => new URL(request.url()).pathname.endsWith('/src/pages/Volunteer.tsx'),
  );
  await volunteerButton.hover();
  await volunteerChunkRequest;
  expect(routeChunkRequests).toEqual([
    '/src/pages/About.tsx',
    '/src/pages/ProjectDetail.tsx',
    '/src/pages/Donate.tsx',
    '/src/pages/Volunteer.tsx',
  ]);

  await volunteerButton.click();
  await expect(page).toHaveURL('/volunteer');
  expect(
    await page.evaluate(() => Boolean((window as unknown as { routeLoadingSeen?: boolean }).routeLoadingSeen)),
    'a prefetched volunteer route should not show the generic route-code fallback',
  ).toBe(false);
  await expect(page.getByRole('heading', { level: 1, name: 'Volunteer With Us' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'About Feature' })).toBeVisible();
  await heroSection.getByRole('button').nth(1).click();
  await heroSection.getByRole('button').nth(1).click();
  await heroSection.getByRole('button').nth(1).click();
  await heroSection.getByRole('button').nth(1).click();
  const unsupportedButton = page.getByRole('link', { name: 'Open Unsupported Route' });
  await expect(unsupportedButton).toBeVisible();
  await unsupportedButton.hover();
  await page.waitForTimeout(100);
  expect(
    routeChunkRequests,
    'an unsupported hero route should not preload unrelated code',
  ).toEqual([
    '/src/pages/About.tsx',
    '/src/pages/ProjectDetail.tsx',
    '/src/pages/Donate.tsx',
    '/src/pages/Volunteer.tsx',
  ]);
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
