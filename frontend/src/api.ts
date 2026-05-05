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
  excerpt: string;
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
  author: string | null;
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
    vision_and_purpose: string;
    statement_of_faith: string;
  };
  who_we_are: {
    title: string;
    content: string;
  };
  team: TeamMember[];
}

// API Methods
export const getHome = () => api.get<HomeData>('/home/').then(res => res.data);
export const getProjects = () => api.get<{ projects: Project[] }>('/projects/').then(res => res.data.projects);
export const getProject = (slug: string) => api.get<Project>(`/projects/${slug}/`).then(res => res.data);
export const getBlogs = () => api.get<{ posts: BlogPost[] }>('/blog/').then(res => res.data.posts);
export const getBlog = (slug: string) => api.get<BlogPost>(`/blog/${slug}/`).then(res => res.data);
export const getAbout = () => api.get<AboutData>('/about/').then(res => res.data);
export const getFooter = () => api.get<FooterContent>('/footer/').then(res => res.data);
export const getStats = () => api.get<Stats>('/stats/').then(res => res.data);

export const submitContact = (data: { name: string; email: string; subject: string; message: string }) => 
  api.post<{ message?: string; error?: string }>('/contact/', data).then(res => res.data);

export const submitVolunteer = (data: { full_name: string; email: string; phone: string; message: string }) => 
  api.post<{ message?: string; error?: string }>('/volunteer/', data).then(res => res.data);

export const subscribeNewsletter = (data: { email: string; first_name?: string }) => 
  api.post<{ message?: string; error?: string }>('/newsletter/subscribe/', data).then(res => res.data);

export const unsubscribeNewsletter = (token: string) => 
  api.get<{ message?: string; error?: string }>(`/newsletter/unsubscribe/${token}/`).then(res => res.data);
