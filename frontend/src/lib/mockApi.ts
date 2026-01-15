// Mock API that mimics axios interface
import { mockApps, mockVotes, mockComments, mockUsers, mockProjects } from './mockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  async get(path: string, config?: any) {
    await delay(200); // Simulate network delay
    
    // Handle query params
    const [basePath, queryString] = path.split('?');
    
    if (basePath === '/apps' || basePath === '/api/apps') {
      // Handle search param if present
      if (config?.params?.search) {
        const searchTerm = config.params.search.toLowerCase();
        const filtered = mockApps.filter(app => 
          app.name.toLowerCase().includes(searchTerm) ||
          app.short_description.toLowerCase().includes(searchTerm)
        );
        return { data: filtered };
      }
      return { data: mockApps };
    }
    
    if (basePath.startsWith('/apps/') || basePath.startsWith('/api/apps/')) {
      const parts = basePath.split('/');
      const appId = parts[parts.length - 1];
      
      // Check if it's votes or comments endpoint
      if (path.includes('/votes')) {
        const votes = mockVotes[appId as keyof typeof mockVotes] || { 
          upvotes: 0, 
          downvotes: 0, 
          net_score: 0, 
          user_vote: null 
        };
        return { data: votes };
      }
      
      if (path.includes('/comments')) {
        const comments = mockComments[appId as keyof typeof mockComments] || [];
        return { data: comments };
      }
      
      // Get app by ID
      const app = mockApps.find((a) => a.id === appId);
      if (app) {
        return { data: app };
      }
      throw { response: { status: 404, data: { detail: 'App not found' } } };
    }
    
    if (path === '/auth/me' || path === '/api/auth/me') {
      return { data: mockUsers.alice };
    }
    
    // Projects endpoints
    if (basePath === '/projects' || basePath === '/api/projects') {
      const params = config?.params || {};
      let projects = [...mockProjects];
      
      // Filter by my_projects
      if (params.my_projects) {
        const userId = '1'; // Mock current user ID (alice)
        projects = projects.filter(p => 
          p.owner_id === userId || p.members.some(m => m.user_id === userId)
        );
      }
      
      // Filter by is_public
      if (params.is_public !== undefined) {
        projects = projects.filter(p => p.is_public === params.is_public);
      }
      
      // Search
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        projects = projects.filter(p =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      return { data: projects };
    }
    
    if (basePath === '/projects/public' || basePath === '/api/projects/public') {
      const publicProjects = mockProjects.filter(p => p.is_public);
      return { data: publicProjects };
    }
    
    if (basePath.startsWith('/projects/') || basePath.startsWith('/api/projects/')) {
      const parts = basePath.split('/');
      const projectId = parts[parts.length - 1];
      
      // Check if it's todos endpoint
      if (path.includes('/todos')) {
        const project = mockProjects.find(p => p.id === projectId);
        if (project) {
          return { data: project.todos };
        }
        throw { response: { status: 404, data: { detail: 'Project not found' } } };
      }
      
      // Check if it's members endpoint
      if (path.includes('/members')) {
        const project = mockProjects.find(p => p.id === projectId);
        if (project) {
          return { data: project.members };
        }
        throw { response: { status: 404, data: { detail: 'Project not found' } } };
      }
      
      // Get project by ID
      const project = mockProjects.find(p => p.id === projectId);
      if (project) {
        return { data: project };
      }
      throw { response: { status: 404, data: { detail: 'Project not found' } } };
    }
    
    throw { response: { status: 404, data: { detail: 'Not found' } } };
  },
  
  async post(path: string, data?: any, config?: any) {
    await delay(300);
    
    if (path === '/auth/login' || path === '/api/auth/login') {
      const { username, password } = data || {};
      if ((username === 'alice' || username === 'admin' || username === 'bob') && password) {
        return { data: { access_token: 'mock-token', token_type: 'bearer' } };
      }
      throw { response: { status: 401, data: { detail: 'Invalid credentials' } } };
    }
    
    if (path === '/auth/register' || path === '/api/auth/register') {
      return {
        data: {
          id: 'new-user',
          username: data?.username,
          email: data?.email,
          full_name: data?.full_name,
          role: 'developer',
        },
      };
    }
    
    if (path.includes('/vote')) {
      const appId = path.split('/apps/')[1]?.split('/vote')[0];
      return { data: { id: 'vote-1', app_id: appId, ...data } };
    }
    
    if (path.includes('/comments')) {
      const appId = path.split('/apps/')[1]?.split('/comments')[0];
      return {
        data: {
          id: `comment-${Date.now()}`,
          app_id: appId,
          user_id: '1',
          user: mockUsers.alice,
          content: data?.content || '',
          parent_comment_id: data?.parent_comment_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          replies: [],
        },
      };
    }
    
    // Projects
    if (path.startsWith('/projects') || path.startsWith('/api/projects')) {
      // Create project
      if (path === '/projects' || path === '/api/projects') {
        const newProject = {
          id: `project-${Date.now()}`,
          name: data?.name || 'New Project',
          description: data?.description || '',
          owner_id: '1',
          is_public: data?.is_public || false,
          progress_mode: data?.progress_mode || 'auto',
          progress: data?.progress || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner: mockUsers.alice,
          todos: (data?.initial_todos || []).map((title: string, i: number) => ({
            id: `todo-${Date.now()}-${i}`,
            project_id: `project-${Date.now()}`,
            title,
            completed: false,
            created_at: new Date().toISOString(),
          })),
          members: [{
            id: `member-${Date.now()}`,
            project_id: `project-${Date.now()}`,
            user_id: '1',
            role: 'owner',
            joined_at: new Date().toISOString(),
          }],
          app_ids: [],
        };
        return { data: newProject };
      }
      
      // Create todo
      if (path.includes('/todos')) {
        const newTodo = {
          id: `todo-${Date.now()}`,
          project_id: path.split('/projects/')[1]?.split('/todos')[0],
          title: data?.title || '',
          completed: false,
          created_at: new Date().toISOString(),
        };
        return { data: newTodo };
      }
    }
    
    return { data: { success: true } };
  },
  
  async put(path: string, data?: any, config?: any) {
    await delay(300);
    
    // Update project
    if (path.startsWith('/projects/') || path.startsWith('/api/projects/')) {
      if (path.includes('/todos/')) {
        // Update todo
        return { 
          data: { 
            ...data, 
            id: path.split('/todos/')[1],
            completed_at: data?.completed ? new Date().toISOString() : null 
          } 
        };
      }
      // Update project
      const projectId = path.split('/projects/')[1]?.split('/')[0];
      const project = mockProjects.find(p => p.id === projectId);
      if (project) {
        return { data: { ...project, ...data, updated_at: new Date().toISOString() } };
      }
    }
    
    return { data: { success: true } };
  },
  
  async delete(path: string, config?: any) {
    await delay(300);
    return { data: { success: true } };
  },
};
