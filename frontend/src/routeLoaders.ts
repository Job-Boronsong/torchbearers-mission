export const loadHome = () => import('./pages/Home');
export const loadAbout = () => import('./pages/About');
export const loadProjects = () => import('./pages/Projects');
export const loadProjectDetail = () => import('./pages/ProjectDetail');
export const loadBlog = () => import('./pages/Blog');
export const loadBlogDetail = () => import('./pages/BlogDetail');
export const loadContact = () => import('./pages/Contact');
export const loadDonate = () => import('./pages/Donate');
export const loadVolunteer = () => import('./pages/Volunteer');
export const loadUnsubscribe = () => import('./pages/Unsubscribe');

type PublicRouteLoader = () => Promise<unknown>;

const publicRouteLoaders: Record<string, PublicRouteLoader> = {
  '/': loadHome,
  '/about': loadAbout,
  '/projects': loadProjects,
  '/blog': loadBlog,
  '/contact': loadContact,
};

const publicHeroRouteLoaders: Record<string, PublicRouteLoader> = {
  ...publicRouteLoaders,
  '/donate': loadDonate,
  '/volunteer': loadVolunteer,
};

const publicDetailRouteLoaders: Array<{ prefix: string; loader: PublicRouteLoader }> = [
  { prefix: '/projects/', loader: loadProjectDetail },
  { prefix: '/blog/', loader: loadBlogDetail },
];

export const publicRoutePaths = Object.keys(publicRouteLoaders);

type ConnectionInformation = {
  effectiveType?: string;
  saveData?: boolean;
};

const getConnectionInformation = () => (
  typeof navigator === 'undefined'
    ? undefined
    : (navigator as Navigator & { connection?: ConnectionInformation }).connection
);

export const canPrefetchPublicRoutes = () => {
  if (typeof navigator === 'undefined' || navigator.onLine === false) {
    return false;
  }

  const connection = getConnectionInformation();
  return !connection?.saveData
    && !['slow-2g', '2g'].includes(connection?.effectiveType ?? '');
};

export const preloadPublicRoute = (pathname: string) => (
  publicRouteLoaders[pathname]?.()
    ?? publicDetailRouteLoaders.find(route => pathname.startsWith(route.prefix))?.loader()
    ?? Promise.resolve()
);

export const preloadHeroRoute = (pathname: string) => (
  publicHeroRouteLoaders[pathname]?.()
    ?? publicDetailRouteLoaders.find(route => pathname.startsWith(route.prefix))?.loader()
    ?? Promise.resolve()
);

export const preloadPublicRoutes = async (currentPathname: string) => {
  if (!canPrefetchPublicRoutes()) {
    return;
  }

  await Promise.all(
    publicRoutePaths
      .filter(pathname => pathname !== currentPathname)
      .map(pathname => preloadPublicRoute(pathname)),
  );
};