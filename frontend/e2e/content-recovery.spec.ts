import { expect, test } from '@playwright/test';
import type { Request } from '@playwright/test';

interface RecoveryPage {
  path: string;
  apiPath: string;
  unavailableTitle: string;
  successBody: unknown;
  successHeading: string;
}

const recoveryPages: RecoveryPage[] = [
  {
    path: '/about',
    apiPath: '/api/about/',
    unavailableTitle: 'We couldn’t load the about page',
    successBody: {
      mission_vision: {
        hero_image: null,
        hero_title: 'About the Mission',
        hero_subtitle: 'Serving communities with hope.',
        vision_and_purpose: '<p>Our vision.</p>',
        statement_of_faith: '<p>Our faith.</p>',
      },
      who_we_are: {
        title: 'Who We Are',
        content: '<p>Our story.</p>',
      },
      director_message: null,
      team: [],
    },
    successHeading: 'About the Mission',
  },
  {
    path: '/projects',
    apiPath: '/api/projects/',
    unavailableTitle: 'We couldn’t load our projects',
    successBody: {
      projects: [{
        id: 1,
        title: 'Community Support',
        slug: 'community-support',
        description: 'Supporting communities.',
        feature_image: null,
        created_at: '2026-01-01T00:00:00Z',
        show_donate: false,
      }],
    },
    successHeading: 'Community Support',
  },
  {
    path: '/blog',
    apiPath: '/api/blog/',
    unavailableTitle: 'We couldn’t load the blog',
    successBody: {
      posts: [{
        id: 1,
        title: 'Mission Update',
        slug: 'mission-update',
        feature_image: null,
        seo_description: 'A field update.',
        content: '<p>Mission news.</p>',
        created_at: '2026-01-01T00:00:00Z',
      }],
    },
    successHeading: 'Mission Update',
  },
  {
    path: '/projects/community-support',
    apiPath: '/api/projects/community-support/',
    unavailableTitle: 'We couldn’t load this project',
    successBody: {
      id: 1,
      title: 'Community Support',
      slug: 'community-support',
      description: '<p>Supporting communities.</p>',
      feature_image: null,
      created_at: '2026-01-01T00:00:00Z',
      show_donate: false,
    },
    successHeading: 'Community Support',
  },
  {
    path: '/blog/mission-update',
    apiPath: '/api/blog/mission-update/',
    unavailableTitle: 'We couldn’t load this article',
    successBody: {
      id: 1,
      title: 'Mission Update',
      slug: 'mission-update',
      feature_image: null,
      seo_description: 'A field update.',
      content: '<p>Mission news.</p>',
      created_at: '2026-01-01T00:00:00Z',
    },
    successHeading: 'Mission Update',
  },
];

const isPageApiRequest = (request: Request, apiPath: string) => {
  const url = new URL(request.url());
  return url.origin === 'http://127.0.0.1:4173' && url.pathname === apiPath;
};

interface CachedDetailPage {
  path: string;
  apiPath: string;
  parentLink: string;
  parentPath: string;
  parentHeading: string;
  loadingLabel: string;
  initialHeading: string;
  refreshedHeading: string;
  successBody: Record<string, unknown>;
}

const cachedDetailPages: CachedDetailPage[] = [
  {
    path: '/projects/community-support',
    apiPath: '/api/projects/community-support/',
    parentLink: 'Projects',
    parentPath: '/projects',
    parentHeading: 'Our Projects',
    loadingLabel: 'Loading project',
    initialHeading: 'Community Support',
    refreshedHeading: 'Community Support Updated',
    successBody: {
      id: 1,
      title: 'Community Support',
      slug: 'community-support',
      description: '<p>Supporting communities.</p>',
      feature_image: null,
      created_at: '2026-01-01T00:00:00Z',
      show_donate: false,
    },
  },
  {
    path: '/blog/mission-update',
    apiPath: '/api/blog/mission-update/',
    parentLink: 'Blog',
    parentPath: '/blog',
    parentHeading: 'Our Blog',
    loadingLabel: 'Loading article',
    initialHeading: 'Mission Update',
    refreshedHeading: 'Mission Update Refreshed',
    successBody: {
      id: 1,
      title: 'Mission Update',
      slug: 'mission-update',
      feature_image: null,
      seo_description: 'A field update.',
      content: '<p>Mission news.</p>',
      created_at: '2026-01-01T00:00:00Z',
    },
  },
];

for (const detailPage of cachedDetailPages) {
  test(`${detailPage.path} reuses fresh cached content after returning to the page`, async ({ page }) => {
    let pageRequests = 0;

    await page.route(`**${detailPage.apiPath}`, async (route) => {
      pageRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detailPage.successBody),
      });
    });

    await page.goto(detailPage.path);
    await expect(page.getByRole('heading', { level: 1, name: detailPage.initialHeading })).toBeVisible();

    await page.getByRole('banner').getByRole('link', { name: detailPage.parentLink, exact: true }).click();
    await expect(page).toHaveURL(detailPage.parentPath);
    await expect(page.getByRole('heading', { level: 1, name: detailPage.parentHeading })).toBeVisible();
    await page.goBack();

    await expect(page.getByRole('status', { name: detailPage.loadingLabel })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: detailPage.initialHeading })).toBeVisible();
    expect(pageRequests, `${detailPage.apiPath} should be reused from the fresh cache`).toBe(1);
  });

  test(`${detailPage.path} refreshes cached content after its freshness window expires`, async ({ page }) => {
    let pageRequests = 0;

    await page.clock.install();
    await page.route(`**${detailPage.apiPath}`, async (route) => {
      pageRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...detailPage.successBody,
          title: pageRequests === 1 ? detailPage.initialHeading : detailPage.refreshedHeading,
        }),
      });
    });

    await page.goto(detailPage.path);
    await expect(page.getByRole('heading', { level: 1, name: detailPage.initialHeading })).toBeVisible();

    await page.clock.fastForward(30_001);
    await page.getByRole('banner').getByRole('link', { name: detailPage.parentLink, exact: true }).click();
    await expect(page).toHaveURL(detailPage.parentPath);
    await expect(page.getByRole('heading', { level: 1, name: detailPage.parentHeading })).toBeVisible();
    const refreshedResponsePromise = page.waitForResponse(
      (response) =>
        isPageApiRequest(response.request(), detailPage.apiPath) &&
        response.status() === 200,
    );
    await page.goBack();
    await refreshedResponsePromise;

    await expect(
      page.getByRole('heading', { level: 1, name: detailPage.refreshedHeading }),
    ).toBeVisible();
    expect(pageRequests, `${detailPage.apiPath} should be requested again after cache expiry`).toBe(2);
  });
}

for (const recoveryPage of recoveryPages) {
  test(`${recoveryPage.path} retries unavailable content without hiding site navigation`, async ({ page }) => {
    let pageRequests = 0;

    await page.route(`**${recoveryPage.apiPath}`, async (route) => {
      pageRequests += 1;
      if (pageRequests === 1) {
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
        body: JSON.stringify(recoveryPage.successBody),
      });
    });

    await page.goto(recoveryPage.path);

    await expect(
      page.getByRole('heading', { level: 1, name: recoveryPage.unavailableTitle }),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Please try again.');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(pageRequests, `${recoveryPage.apiPath} should be requested once initially`).toBe(1);

    const retryResponsePromise = page.waitForResponse(
      (response) =>
        isPageApiRequest(response.request(), recoveryPage.apiPath) &&
        response.status() === 200,
    );
    await page.getByRole('button', { name: 'Try again' }).click();
    await retryResponsePromise;

    await expect(
      page.getByRole('heading', { name: recoveryPage.successHeading }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: recoveryPage.unavailableTitle }),
    ).toHaveCount(0);
  });
}