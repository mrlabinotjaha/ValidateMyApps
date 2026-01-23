// API Types for ValidateMyApps

// User types
export interface UserInfo {
  id: string
  username: string
  full_name?: string
}

// App types
export interface AppImage {
  id: string
  app_id: string
  image_url: string
  is_featured: boolean
  order_index: number
  created_at: string
}

export interface AppTag {
  id: string
  name: string
}

export type AppStatus = 'in_development' | 'beta' | 'completed' | 'deprecated'
export type ProgressMode = 'auto' | 'manual'

export interface AppTask {
  id: string
  app_id: string
  title: string
  is_completed: boolean
  created_at: string
}

export interface App {
  id: string
  name: string
  full_description?: string
  status: AppStatus
  is_published: boolean
  progress: number
  progress_mode: ProgressMode
  repository_url?: string
  app_url?: string
  creator_id: string
  team_id?: string
  created_at: string
  updated_at: string
  images: AppImage[]
  tags: AppTag[]
  tasks: AppTask[]
  vote_count: number
  upvotes?: number
  downvotes?: number
  total_votes?: number
  comment_count: number
  creator?: UserInfo
  has_github_token?: boolean
}

// Project types (legacy - will be removed)
export type ProjectRole = 'owner' | 'member'

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
  user: UserInfo
  role: ProjectRole
  joined_at: string
}

export interface ProjectInvitation {
  id: string
  project_id: string
  email: string
  invited_by_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at?: string
  invited_by: UserInfo
}

export interface Project {
  id: string
  name: string
  description: string
  owner_id: string
  owner: UserInfo
  is_public: boolean
  progress_mode: ProgressMode
  progress: number
  created_at: string
  updated_at: string
  todos: ProjectTodo[]
  members?: ProjectMember[]
  member_count?: number
  app_count?: number
}

// Vote types
export type VoteType = 'upvote' | 'downvote'

export interface VoteInfo {
  upvotes: number
  downvotes: number
  net_score: number
  user_vote: VoteType | null
}

// Comment types
export interface Comment {
  id: string
  app_id: string
  user_id: string
  user: UserInfo
  content: string
  parent_comment_id: string | null
  created_at: string
  updated_at: string
  replies: Comment[]
}

// Team types
export interface Team {
  id: string
  name: string
  description?: string
  owner_id: string
  owner: UserInfo
  created_at: string
  updated_at: string
  member_count?: number
  app_count?: number
  project_count?: number // Deprecated - use app_count instead
  invitation_status?: 'pending' | null
  invitation_id?: string | null
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  user: UserInfo
}

export interface TeamInvitation {
  id: string
  team_id: string
  email: string
  invited_by_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at?: string
  invited_by: UserInfo
}

// API Request/Response types
export interface CreateProjectRequest {
  name: string
  description?: string
  team_id: string  // Projects must belong to a team
  is_public?: boolean
  progress_mode?: ProgressMode
  progress?: number
  initial_todos?: string[]
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  is_public?: boolean
  progress_mode?: ProgressMode
  progress?: number
}

export interface CreateTodoRequest {
  title: string
}

export interface UpdateTodoRequest {
  title?: string
  completed?: boolean
}

export interface CreateAppRequest {
  name: string
  full_description?: string
  status?: AppStatus
  is_published?: boolean
  repository_url?: string
  app_url?: string
  team_id?: string
  tag_ids?: string[]
}

export interface UpdateAppRequest {
  name?: string
  full_description?: string
  status?: AppStatus
  is_published?: boolean
  progress?: number
  progress_mode?: ProgressMode
  repository_url?: string | null
  app_url?: string | null
  team_id?: string
  tag_ids?: string[]
}

// Repository/Commits types
export interface CommitInfo {
  sha: string
  full_sha: string
  message: string
  author: string
  date: string
  url: string
}

export interface RepoInfo {
  name: string
  full_name: string
  description?: string
  stars: number
  forks: number
  language?: string
  open_issues: number
  default_branch: string
  url: string
  is_private: boolean
}

export interface CommitsResponse {
  commits: CommitInfo[]
  repo_info?: RepoInfo
  error?: string
}

export interface GitHubStatus {
  connected: boolean
  username?: string
}
