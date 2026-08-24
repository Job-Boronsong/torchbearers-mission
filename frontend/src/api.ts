import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Data Types
export interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string | null;
  button_text: string;
  button_link: string;
  layout: 'center' | 'left' | 'right';
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  feature_image: string | null;
  created_at: string;
  show_donate: boolean;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  feature_image: string | null;
  seo_description: string;
  content: string;
  created_at: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  photo: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
}

export interface FooterContent {
  address: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  map_embed: string | null;
}

export interface Stats {
  total_donations: string;
  donor_count: number;
  project_count: number;
  volunteer_count: number;
}

export interface HomeData {
  slides: Slide[];
  featured_projects: Project[];
  featured_blogs: BlogPost[];
  total_donations: string;
  donor_count: number;
}

export interface AboutData {
  mission_vision: {
    hero_image: string | null;
    hero_title: string;
    hero_subtitle: string;
    vision_and_purpose: string;
    statement_of_faith: string;
  };
  who_we_are: {
    title: string;
    content: string;
  };
  director_message: {
    name: string;
    title: string;
    photo: string | null;
    message: string;
  } | null;
  team: TeamMember[];
}

// Public CMS content changes infrequently, so keep successful responses for a short
// period to make return navigation instant without allowing stale content to linger.
export const PUBLIC_CONTENT_CACHE_TTL_MS = 30_000;
export const PUBLIC_CONTENT_CACHE_STORAGE_KEY = 'public-content-cache';
const publicContentCacheKeys: Record<string, string> = {
  '/': 'home',
  '/about': 'about',
  '/projects': 'projects',
  '/blog': 'blogs',
};

interface PublicContentCacheEntry {
  data: unknown;
  expiresAt: number;
}

interface StoredPublicContentCache {
  version: 1;
  entries: Record<string, PublicContentCacheEntry>;
}

export interface PublicRequestOptions {
  forceRefresh?: boolean;
}

export const getPublicContentCacheKey = (pathname: string) => publicContentCacheKeys[pathname];

const inFlightPublicRequests = new Map<string, Promise<unknown>>();
const publicContentCache = new Map<string, PublicContentCacheEntry>();
const persistedPublicContentKeys = new Set(['home', 'about', 'projects', 'blogs']);
let hasHydratedBrowserCache = false;

const persistPublicContentCache = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const entries: Record<string, PublicContentCacheEntry> = {};
  const now = Date.now();

  persistedPublicContentKeys.forEach(key => {
    const cached = publicContentCache.get(key);
    if (cached && cached.expiresAt > now) {
      entries[key] = cached;
    }
  });

  try {
    const storedCache: StoredPublicContentCache = {
      version: 1,
      entries,
    };
    window.localStorage.setItem(PUBLIC_CONTENT_CACHE_STORAGE_KEY, JSON.stringify(storedCache));
  } catch {
    // Browser storage can be unavailable or full. Memory caching still works.
  }
};

const hydrateBrowserCache = () => {
  if (hasHydratedBrowserCache || typeof window === 'undefined') {
    return;
  }

  hasHydratedBrowserCache = true;

  try {
    const rawCache = window.localStorage.getItem(PUBLIC_CONTENT_CACHE_STORAGE_KEY);
    if (!rawCache) {
      return;
    }

    const storedCache = JSON.parse(rawCache) as Partial<StoredPublicContentCache>;
    if (storedCache.version !== 1 || !storedCache.entries || typeof storedCache.entries !== 'object') {
      window.localStorage.removeItem(PUBLIC_CONTENT_CACHE_STORAGE_KEY);
      return;
    }

    const now = Date.now();
    let foundInvalidEntry = false;
    Object.entries(storedCache.entries).forEach(([key, cached]) => {
      if (
        !persistedPublicContentKeys.has(key)
        || !cached
        || typeof cached !== 'object'
        || typeof cached.expiresAt !== 'number'
        || !Number.isFinite(cached.expiresAt)
        || cached.expiresAt <= now
        || !Object.prototype.hasOwnProperty.call(cached, 'data')
      ) {
        foundInvalidEntry = true;
        return;
      }

      publicContentCache.set(key, cached);
    });

    if (foundInvalidEntry) {
      persistPublicContentCache();
    }
  } catch {
    // Ignore malformed or inaccessible browser storage and use the API normally.
    try {
      window.localStorage.removeItem(PUBLIC_CONTENT_CACHE_STORAGE_KEY);
    } catch {
      // Storage can remain inaccessible after a read failure.
    }
  }
};

export const getCachedPublicContent = <T>(key: string): T | undefined => {
  hydrateBrowserCache();

  const cached = publicContentCache.get(key);
  if (!cached) {
    return undefined;
  }

  if (cached.expiresAt <= Date.now()) {
    publicContentCache.delete(key);
    if (persistedPublicContentKeys.has(key)) {
      persistPublicContentCache();
    }
    return undefined;
  }

  return cached.data as T;
};

const shareInFlightPublicRequest = <T>(
  key: string,
  request: () => Promise<T>,
  options: PublicRequestOptions = {},
): Promise<T> => {
  if (!options.forceRefresh) {
    const cached = getCachedPublicContent<T>(key);
    if (cached !== undefined) {
      return Promise.resolve(cached);
    }
  }

  const existingRequest = inFlightPublicRequests.get(key);
  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const newRequest = request()
    .then(data => {
      publicContentCache.set(key, {
        data,
        expiresAt: Date.now() + PUBLIC_CONTENT_CACHE_TTL_MS,
      });
      if (persistedPublicContentKeys.has(key)) {
        persistPublicContentCache();
      }
      return data;
    })
    .finally(() => {
      if (inFlightPublicRequests.get(key) === newRequest) {
        inFlightPublicRequests.delete(key);
      }
    });
  inFlightPublicRequests.set(key, newRequest);
  return newRequest;
};

export const getHome = (options?: PublicRequestOptions) => shareInFlightPublicRequest('home', () =>
  api.get<HomeData>('/home/').then(res => res.data), options
);
export const getProjects = (options?: PublicRequestOptions) => shareInFlightPublicRequest('projects', () =>
  api.get<{ projects: Project[] }>('/projects/').then(res => res.data.projects), options
);
export const getProject = (slug: string, options?: PublicRequestOptions) => shareInFlightPublicRequest(`project:${slug}`, () =>
  api.get<Project>(`/projects/${slug}/`).then(res => res.data), options
);
export const getBlogs = (options?: PublicRequestOptions) => shareInFlightPublicRequest('blogs', () =>
  api.get<{ posts: BlogPost[] }>('/blog/').then(res => res.data.posts), options
);
export const getBlog = (slug: string, options?: PublicRequestOptions) => shareInFlightPublicRequest(`blog:${slug}`, () =>
  api.get<BlogPost>(`/blog/${slug}/`).then(res => res.data), options
);
export const getAbout = (options?: PublicRequestOptions) => shareInFlightPublicRequest('about', () =>
  api.get<AboutData>('/about/').then(res => res.data), options
);

let footerRequest: Promise<FooterContent> | null = null;

export const getFooter = () => {
  if (!footerRequest) {
    footerRequest = api.get<FooterContent>('/footer/')
      .then(res => res.data)
      .finally(() => {
        footerRequest = null;
      });
  }

  return footerRequest;
};
export const getStats = () => api.get<Stats>('/stats/').then(res => res.data);

export const submitContact = (data: { name: string; email: string; subject: string; message: string }) => 
  api.post<{ message?: string; error?: string }>('/contact/', data).then(res => res.data);

export const submitVolunteer = (data: { full_name: string; email: string; phone: string; message: string }) => 
  api.post<{ message?: string; error?: string }>('/volunteer/', data).then(res => res.data);

export const subscribeNewsletter = (data: { email: string; first_name?: string }) => 
  api.post<{ message?: string; error?: string }>('/newsletter/subscribe/', data).then(res => res.data);

export const unsubscribeNewsletter = (token: string) => 
  api.get<{ message?: string; error?: string }>(`/newsletter/unsubscribe/${token}/`).then(res => res.data);
