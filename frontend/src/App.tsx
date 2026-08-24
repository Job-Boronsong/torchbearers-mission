import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import {
  loadAbout,
  loadBlog,
  loadBlogDetail,
  loadContact,
  loadDonate,
  loadHome,
  loadProjectDetail,
  loadProjects,
  loadUnsubscribe,
  loadVolunteer,
} from './routeLoaders';
import './App.css';

const Home = lazy(loadHome);
const About = lazy(loadAbout);
const Projects = lazy(loadProjects);
const ProjectDetail = lazy(loadProjectDetail);
const Blog = lazy(loadBlog);
const BlogDetail = lazy(loadBlogDetail);
const Contact = lazy(loadContact);
const Donate = lazy(loadDonate);
const Volunteer = lazy(loadVolunteer);
const Unsubscribe = lazy(loadUnsubscribe);

const PageLoading = () => (
  <div
    role="status"
    aria-label="Loading page"
    style={{
      minHeight: '40vh',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--text-muted)',
      fontSize: '1rem',
    }}
  >
    Loading…
  </div>
);

function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/newsletter/unsubscribe/:token" element={<Unsubscribe />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
