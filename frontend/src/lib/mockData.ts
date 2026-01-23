// Mock data for frontend testing
export const mockUsers = {
  alice: {
    id: "1",
    username: "alice",
    email: "alice@example.com",
    full_name: "Alice Developer",
    role: "developer",
  },
  admin: {
    id: "2",
    username: "admin",
    email: "admin@example.com",
    full_name: "Admin User",
    role: "admin",
  },
  bob: {
    id: "3",
    username: "bob",
    email: "bob@example.com",
    full_name: "Bob Coder",
    role: "developer",
  },
  charlie: {
    id: "4",
    username: "charlie",
    email: "charlie@example.com",
    full_name: "Charlie Designer",
    role: "developer",
  },
};

// Helper to create SVG data URI
const createPlaceholderImage = (text: string, color: string) => {
  const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="${color}"/><text x="400" y="300" font-family="Arial,sans-serif" font-size="36" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const mockApps = [
  {
    id: "1",
    name: "TaskMaster Pro",
    full_description: "TaskMaster Pro is designed to help teams stay organized and productive. Features include kanban boards, time tracking, team collaboration, and integration with popular tools.",
    status: "beta",
    is_published: true,
    creator_id: "1",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T14:30:00Z",
    images: [
      {
        id: "1",
        app_id: "1",
        image_url: createPlaceholderImage("TaskMaster Pro", "#4F46E5"),
        is_featured: true,
        order_index: 0,
        created_at: "2024-01-15T10:00:00Z",
      },
      {
        id: "2",
        app_id: "1",
        image_url: createPlaceholderImage("Dashboard View", "#6366F1"),
        is_featured: false,
        order_index: 1,
        created_at: "2024-01-15T10:00:00Z",
      },
    ],
    tags: [
      { id: "1", name: "Web App" },
      { id: "2", name: "Dashboard" },
    ],
    vote_count: 4,
    comment_count: 2,
    creator: {
      id: mockUsers.alice.id,
      username: mockUsers.alice.username,
      full_name: mockUsers.alice.full_name,
    },
  },
  {
    id: "2",
    name: "FitTracker Mobile",
    full_description: "FitTracker Mobile helps you achieve your fitness goals with comprehensive tracking of workouts, nutrition, and progress. Includes social features to share achievements with friends.",
    status: "in_development",
    is_published: true,
    creator_id: "3",
    created_at: "2024-01-16T09:00:00Z",
    updated_at: "2024-01-18T16:45:00Z",
    images: [
      {
        id: "3",
        app_id: "2",
        image_url: createPlaceholderImage("FitTracker", "#10B981"),
        is_featured: true,
        order_index: 0,
        created_at: "2024-01-16T09:00:00Z",
      },
      {
        id: "4",
        app_id: "2",
        image_url: createPlaceholderImage("Analytics", "#059669"),
        is_featured: false,
        order_index: 1,
        created_at: "2024-01-16T09:00:00Z",
      },
    ],
    tags: [
      { id: "3", name: "Mobile" },
      { id: "4", name: "Tool" },
    ],
    vote_count: 0,
    comment_count: 1,
    creator: {
      id: mockUsers.bob.id,
      username: mockUsers.bob.username,
      full_name: mockUsers.bob.full_name,
    },
  },
  {
    id: "3",
    name: "CodeReview Hub",
    full_description: "CodeReview Hub makes code reviews faster and more efficient. Features include automated code analysis, suggestion engine, team collaboration tools, and integration with Git.",
    status: "completed",
    is_published: true,
    creator_id: "1",
    created_at: "2024-01-10T08:00:00Z",
    updated_at: "2024-01-12T12:00:00Z",
    images: [
      {
        id: "5",
        app_id: "3",
        image_url: createPlaceholderImage("CodeReview Hub", "#F59E0B"),
        is_featured: true,
        order_index: 0,
        created_at: "2024-01-10T08:00:00Z",
      },
    ],
    tags: [
      { id: "1", name: "Web App" },
      { id: "5", name: "API" },
    ],
    vote_count: 2,
    comment_count: 1,
    creator: {
      id: mockUsers.alice.id,
      username: mockUsers.alice.username,
      full_name: mockUsers.alice.full_name,
    },
  },
  {
    id: "4",
    name: "PixelQuest",
    full_description: "PixelQuest combines classic puzzle mechanics with modern game design. Features 100+ levels, daily challenges, leaderboards, and unlockable achievements.",
    status: "beta",
    is_published: true,
    creator_id: "3",
    created_at: "2024-01-14T11:00:00Z",
    updated_at: "2024-01-19T10:00:00Z",
    images: [
      {
        id: "6",
        app_id: "4",
        image_url: createPlaceholderImage("PixelQuest", "#EF4444"),
        is_featured: true,
        order_index: 0,
        created_at: "2024-01-14T11:00:00Z",
      },
      {
        id: "7",
        app_id: "4",
        image_url: createPlaceholderImage("Game Level", "#DC2626"),
        is_featured: false,
        order_index: 1,
        created_at: "2024-01-14T11:00:00Z",
      },
    ],
    tags: [
      { id: "3", name: "Mobile" },
      { id: "6", name: "Game" },
    ],
    vote_count: 3,
    comment_count: 2,
    creator: {
      id: mockUsers.bob.id,
      username: mockUsers.bob.username,
      full_name: mockUsers.bob.full_name,
    },
  },
  {
    id: "5",
    name: "DataViz Platform",
    full_description: "DataViz Platform makes data visualization accessible to everyone. Import data from multiple sources, choose from 50+ chart types, and share interactive dashboards with your team.",
    status: "in_development",
    is_published: true,
    creator_id: "1",
    created_at: "2024-01-17T13:00:00Z",
    updated_at: "2024-01-21T09:00:00Z",
    images: [
      {
        id: "8",
        app_id: "5",
        image_url: createPlaceholderImage("DataViz", "#8B5CF6"),
        is_featured: true,
        order_index: 0,
        created_at: "2024-01-17T13:00:00Z",
      },
    ],
    tags: [
      { id: "1", name: "Web App" },
      { id: "2", name: "Dashboard" },
    ],
    vote_count: 0,
    comment_count: 0,
    creator: {
      id: mockUsers.alice.id,
      username: mockUsers.alice.username,
      full_name: mockUsers.alice.full_name,
    },
  },
  {
    id: "6",
    name: "CloudSync Pro",
    full_description: "CloudSync Pro provides secure cloud storage with advanced features like version control, file sharing, and team collaboration. Built with privacy in mind, all files are encrypted before upload.",
    status: "beta",
    is_published: true,
    creator_id: "4",
    created_at: "2024-01-22T08:00:00Z",
    updated_at: "2024-01-25T15:20:00Z",
    images: [
      {
        id: "9",
        app_id: "6",
        image_url: createPlaceholderImage("CloudSync Pro", "#3B82F6"),
        is_featured: true,
        order_index: 0,
        created_at: "2024-01-22T08:00:00Z",
      },
      {
        id: "10",
        app_id: "6",
        image_url: createPlaceholderImage("File Manager", "#2563EB"),
        is_featured: false,
        order_index: 1,
        created_at: "2024-01-22T08:00:00Z",
      },
    ],
    tags: [
      { id: "1", name: "Web App" },
      { id: "7", name: "Cloud" },
    ],
    vote_count: 5,
    comment_count: 3,
    creator: {
      id: mockUsers.charlie.id,
      username: mockUsers.charlie.username,
      full_name: mockUsers.charlie.full_name,
    },
  },
  {
    id: "7",
    name: "MindMapper",
    full_description: "MindMapper is an intuitive tool for creating mind maps, flowcharts, and visual diagrams. Features include templates, collaboration tools, export to multiple formats, and cloud sync.",
    status: "completed",
    is_published: true,
    creator_id: "4",
    created_at: "2024-01-20T10:30:00Z",
    updated_at: "2024-01-24T11:45:00Z",
    images: [
      {
        id: "11",
        app_id: "7",
        image_url: createPlaceholderImage("MindMapper", "#EC4899"),
        is_featured: true,
        order_index: 0,
        created_at: "2024-01-20T10:30:00Z",
      },
      {
        id: "12",
        app_id: "7",
        image_url: createPlaceholderImage("Mind Map View", "#DB2777"),
        is_featured: false,
        order_index: 1,
        created_at: "2024-01-20T10:30:00Z",
      },
    ],
    tags: [
      { id: "1", name: "Web App" },
      { id: "8", name: "Productivity" },
    ],
    vote_count: 7,
    comment_count: 4,
    creator: {
      id: mockUsers.charlie.id,
      username: mockUsers.charlie.username,
      full_name: mockUsers.charlie.full_name,
    },
  },
];

export const mockVotes = {
  "1": { upvotes: 4, downvotes: 0, net_score: 4, user_vote: "upvote" },
  "2": { upvotes: 1, downvotes: 1, net_score: 0, user_vote: null },
  "3": { upvotes: 2, downvotes: 0, net_score: 2, user_vote: "upvote" },
  "4": { upvotes: 3, downvotes: 0, net_score: 3, user_vote: "upvote" },
  "5": { upvotes: 1, downvotes: 1, net_score: 0, user_vote: "downvote" },
  "6": { upvotes: 5, downvotes: 0, net_score: 5, user_vote: "upvote" },
  "7": { upvotes: 7, downvotes: 0, net_score: 7, user_vote: "upvote" },
};

export const mockComments = {
  "1": [
    {
      id: "1",
      app_id: "1",
      user_id: "3",
      user: mockUsers.bob,
      content: "This looks amazing! Love the clean UI design.",
      parent_comment_id: null,
      created_at: "2024-01-16T10:00:00Z",
      updated_at: "2024-01-16T10:00:00Z",
      replies: [
        {
          id: "2",
          app_id: "1",
          user_id: "1",
          user: mockUsers.alice,
          content: "Thanks! We spent a lot of time on the UX.",
          parent_comment_id: "1",
          created_at: "2024-01-16T11:00:00Z",
          updated_at: "2024-01-16T11:00:00Z",
          replies: [],
        },
      ],
    },
    {
      id: "3",
      app_id: "1",
      user_id: "2",
      user: mockUsers.admin,
      content: "Great work on the real-time collaboration features. When is the mobile app coming?",
      parent_comment_id: null,
      created_at: "2024-01-17T14:00:00Z",
      updated_at: "2024-01-17T14:00:00Z",
      replies: [],
    },
  ],
  "2": [
    {
      id: "4",
      app_id: "2",
      user_id: "1",
      user: mockUsers.alice,
      content: "The analytics dashboard is really impressive. How do you handle data sync across devices?",
      parent_comment_id: null,
      created_at: "2024-01-17T15:00:00Z",
      updated_at: "2024-01-17T15:00:00Z",
      replies: [],
    },
  ],
  "3": [
    {
      id: "5",
      app_id: "3",
      user_id: "3",
      user: mockUsers.bob,
      content: "Just tried this out - it's so much faster than our old code review process!",
      parent_comment_id: null,
      created_at: "2024-01-13T09:00:00Z",
      updated_at: "2024-01-13T09:00:00Z",
      replies: [],
    },
  ],
  "4": [
    {
      id: "6",
      app_id: "4",
      user_id: "1",
      user: mockUsers.alice,
      content: "The pixel art style is beautiful. How many levels are planned?",
      parent_comment_id: null,
      created_at: "2024-01-15T12:00:00Z",
      updated_at: "2024-01-15T12:00:00Z",
      replies: [
        {
          id: "7",
          app_id: "4",
          user_id: "3",
          user: mockUsers.bob,
          content: "We're planning to release 200+ levels over the next few months!",
          parent_comment_id: "6",
          created_at: "2024-01-15T13:00:00Z",
          updated_at: "2024-01-15T13:00:00Z",
          replies: [],
        },
      ],
    },
  ],
  "5": [],
  "6": [
    {
      id: "8",
      app_id: "6",
      user_id: "1",
      user: mockUsers.alice,
      content: "The encryption features are exactly what I was looking for. Great work!",
      parent_comment_id: null,
      created_at: "2024-01-23T09:00:00Z",
      updated_at: "2024-01-23T09:00:00Z",
      replies: [],
    },
    {
      id: "9",
      app_id: "6",
      user_id: "3",
      user: mockUsers.bob,
      content: "How much storage space is included in the free tier?",
      parent_comment_id: null,
      created_at: "2024-01-24T14:00:00Z",
      updated_at: "2024-01-24T14:00:00Z",
      replies: [
        {
          id: "10",
          app_id: "6",
          user_id: "4",
          user: mockUsers.charlie,
          content: "The free tier includes 10GB of storage with the option to upgrade.",
          parent_comment_id: "9",
          created_at: "2024-01-24T15:00:00Z",
          updated_at: "2024-01-24T15:00:00Z",
          replies: [],
        },
      ],
    },
    {
      id: "11",
      app_id: "6",
      user_id: "2",
      user: mockUsers.admin,
      content: "The real-time sync is incredibly fast. Impressive implementation!",
      parent_comment_id: null,
      created_at: "2024-01-25T10:00:00Z",
      updated_at: "2024-01-25T10:00:00Z",
      replies: [],
    },
  ],
  "7": [
    {
      id: "12",
      app_id: "7",
      user_id: "1",
      user: mockUsers.alice,
      content: "This is perfect for brainstorming sessions. The templates are really helpful!",
      parent_comment_id: null,
      created_at: "2024-01-21T11:00:00Z",
      updated_at: "2024-01-21T11:00:00Z",
      replies: [],
    },
    {
      id: "13",
      app_id: "7",
      user_id: "3",
      user: mockUsers.bob,
      content: "Can you export to PDF? That would be a game-changer for presentations.",
      parent_comment_id: null,
      created_at: "2024-01-22T13:00:00Z",
      updated_at: "2024-01-22T13:00:00Z",
      replies: [
        {
          id: "14",
          app_id: "7",
          user_id: "4",
          user: mockUsers.charlie,
          content: "Yes! PDF export is available, along with PNG, SVG, and JSON formats.",
          parent_comment_id: "13",
          created_at: "2024-01-22T14:00:00Z",
          updated_at: "2024-01-22T14:00:00Z",
          replies: [],
        },
      ],
    },
    {
      id: "15",
      app_id: "7",
      user_id: "2",
      user: mockUsers.admin,
      content: "The collaboration features work seamlessly. Great job on the UI/UX!",
      parent_comment_id: null,
      created_at: "2024-01-23T16:00:00Z",
      updated_at: "2024-01-23T16:00:00Z",
      replies: [],
    },
    {
      id: "16",
      app_id: "7",
      user_id: "1",
      user: mockUsers.alice,
      content: "I've been using this daily for project planning. Highly recommend!",
      parent_comment_id: null,
      created_at: "2024-01-24T09:00:00Z",
      updated_at: "2024-01-24T09:00:00Z",
      replies: [],
    },
  ],
};

// Project types
export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface ProjectTodo {
  id: string
  project_id: string
  title: string
  completed: boolean
  created_at: string
  completed_at?: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  user: typeof mockUsers[keyof typeof mockUsers]
  role: ProjectRole
  joined_at: string
}

export interface ProjectInvitation {
  id: string
  project_id: string
  email: string
  status: 'pending' | 'accepted' | 'declined'
  invited_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  owner_id: string
  owner: typeof mockUsers[keyof typeof mockUsers]
  progress: number
  progress_mode: 'manual' | 'auto'
  members: ProjectMember[]
  invitations: ProjectInvitation[]
  todos: ProjectTodo[]
  app_ids: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

// Mock projects data
export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "E-Commerce Platform",
    description: "Building a modern e-commerce platform with React and Node.js",
    owner_id: "1",
    owner: mockUsers.alice,
    progress: 65,
    progress_mode: 'auto',
    members: [
      {
        id: "mem-1",
        project_id: "proj-1",
        user_id: "1",
        user: mockUsers.alice,
        role: 'owner',
        joined_at: "2024-01-10T10:00:00Z",
      },
      {
        id: "mem-2",
        project_id: "proj-1",
        user_id: "3",
        user: mockUsers.bob,
        role: 'admin',
        joined_at: "2024-01-11T14:00:00Z",
      },
      {
        id: "mem-3",
        project_id: "proj-1",
        user_id: "4",
        user: mockUsers.charlie,
        role: 'member',
        joined_at: "2024-01-12T09:00:00Z",
      },
    ],
    invitations: [
      {
        id: "inv-1",
        project_id: "proj-1",
        email: "john@example.com",
        status: 'pending',
        invited_at: "2024-01-20T10:00:00Z",
      },
    ],
    todos: [
      { id: "todo-1", project_id: "proj-1", title: "Setup project structure", completed: true, created_at: "2024-01-10T10:00:00Z", completed_at: "2024-01-11T15:00:00Z" },
      { id: "todo-2", project_id: "proj-1", title: "Design database schema", completed: true, created_at: "2024-01-10T10:00:00Z", completed_at: "2024-01-12T11:00:00Z" },
      { id: "todo-3", project_id: "proj-1", title: "Implement authentication", completed: true, created_at: "2024-01-10T10:00:00Z", completed_at: "2024-01-14T16:00:00Z" },
      { id: "todo-4", project_id: "proj-1", title: "Build product catalog", completed: true, created_at: "2024-01-10T10:00:00Z", completed_at: "2024-01-18T12:00:00Z" },
      { id: "todo-5", project_id: "proj-1", title: "Implement shopping cart", completed: false, created_at: "2024-01-10T10:00:00Z" },
      { id: "todo-6", project_id: "proj-1", title: "Payment integration", completed: false, created_at: "2024-01-10T10:00:00Z" },
    ],
    app_ids: ["1", "3"],
    is_public: false,
    created_at: "2024-01-10T10:00:00Z",
    updated_at: "2024-01-22T14:00:00Z",
  },
  {
    id: "proj-2",
    name: "Mobile Fitness App",
    description: "Cross-platform fitness tracking application",
    owner_id: "3",
    owner: mockUsers.bob,
    progress: 40,
    progress_mode: 'manual',
    members: [
      {
        id: "mem-4",
        project_id: "proj-2",
        user_id: "3",
        user: mockUsers.bob,
        role: 'owner',
        joined_at: "2024-01-15T08:00:00Z",
      },
      {
        id: "mem-5",
        project_id: "proj-2",
        user_id: "1",
        user: mockUsers.alice,
        role: 'member',
        joined_at: "2024-01-16T10:00:00Z",
      },
    ],
    invitations: [],
    todos: [
      { id: "todo-7", project_id: "proj-2", title: "UI/UX Design", completed: true, created_at: "2024-01-15T08:00:00Z", completed_at: "2024-01-18T17:00:00Z" },
      { id: "todo-8", project_id: "proj-2", title: "Core workout tracking", completed: true, created_at: "2024-01-15T08:00:00Z", completed_at: "2024-01-20T14:00:00Z" },
      { id: "todo-9", project_id: "proj-2", title: "Social features", completed: false, created_at: "2024-01-15T08:00:00Z" },
      { id: "todo-10", project_id: "proj-2", title: "Analytics dashboard", completed: false, created_at: "2024-01-15T08:00:00Z" },
      { id: "todo-11", project_id: "proj-2", title: "Push notifications", completed: false, created_at: "2024-01-15T08:00:00Z" },
    ],
    app_ids: ["2", "4"],
    is_public: false,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-21T11:00:00Z",
  },
  {
    id: "proj-3",
    name: "Data Visualization Tool",
    description: "Open source data visualization library",
    owner_id: "4",
    owner: mockUsers.charlie,
    progress: 80,
    progress_mode: 'auto',
    members: [
      {
        id: "mem-6",
        project_id: "proj-3",
        user_id: "4",
        user: mockUsers.charlie,
        role: 'owner',
        joined_at: "2024-01-05T09:00:00Z",
      },
    ],
    invitations: [
      {
        id: "inv-2",
        project_id: "proj-3",
        email: "sarah@example.com",
        status: 'pending',
        invited_at: "2024-01-22T15:00:00Z",
      },
      {
        id: "inv-3",
        project_id: "proj-3",
        email: "mike@example.com",
        status: 'declined',
        invited_at: "2024-01-18T09:00:00Z",
      },
    ],
    todos: [
      { id: "todo-12", project_id: "proj-3", title: "Core chart components", completed: true, created_at: "2024-01-05T09:00:00Z", completed_at: "2024-01-10T16:00:00Z" },
      { id: "todo-13", project_id: "proj-3", title: "Data import/export", completed: true, created_at: "2024-01-05T09:00:00Z", completed_at: "2024-01-15T12:00:00Z" },
      { id: "todo-14", project_id: "proj-3", title: "Interactive tooltips", completed: true, created_at: "2024-01-05T09:00:00Z", completed_at: "2024-01-18T10:00:00Z" },
      { id: "todo-15", project_id: "proj-3", title: "Documentation", completed: true, created_at: "2024-01-05T09:00:00Z", completed_at: "2024-01-20T14:00:00Z" },
      { id: "todo-16", project_id: "proj-3", title: "Performance optimization", completed: false, created_at: "2024-01-05T09:00:00Z" },
    ],
    app_ids: ["5", "6", "7"],
    is_public: false,
    created_at: "2024-01-05T09:00:00Z",
    updated_at: "2024-01-23T16:00:00Z",
  },
];
