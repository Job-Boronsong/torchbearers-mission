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

const publicRouteLoaders: Record<string, () => Promise<unknown>> = {
  '/': loadHome,
  '/about': loadAbout,
  '/projects': loadProjects,
  '/blog': loadBlog,
};

export const preloadPublicRoute = (pathname: string) => (
  publicRouteLoaders[pathname]?.() ?? Promise.resolve()
);