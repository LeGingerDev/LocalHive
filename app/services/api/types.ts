/**
 * These types indicate the shape of the data you expect to receive from your
 * API endpoint, assuming it's a JSON object like we have.
 */
export interface EpisodeItem {
  title: string
  pubDate: string
  link: string
  guid: string
  author: string
  thumbnail: string
  description: string
  content: string
  enclosure: {
    link: string
    type: string
    length: number
    duration: number
    rating: { scheme: string; value: string }
  }
  categories: string[]
}

export interface ApiFeedResponse {
  status: string
  feed: {
    url: string
    title: string
    link: string
    author: string
    description: string
    image: string
  }
  items: EpisodeItem[]
}

/**
 * The options used to configure apisauce.
 */
export interface ApiConfig {
  /**
   * The URL of the api.
   */
  url: string

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number
}

// Group-related types
export interface Group {
  id: string
  name: string
  description?: string
  category: GroupCategory
  is_public: boolean
  member_limit?: number
  created_at: string
  creator_id: string
  image_url?: string
  creator?: Profile
  member_count?: number
  post_count?: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  user?: Profile
}

export interface GroupInvitation {
  id: string
  group_id: string
  inviter_id: string
  invitee_id: string
  status: InvitationStatus
  created_at: string
  group?: Group
  inviter?: Profile
  invitee?: Profile
}

export interface GroupPost {
  id: string
  group_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  media_urls?: string[]
  user?: Profile
}

export interface Profile {
  id: string
  full_name?: string
  email?: string
  bio?: string
  created_at: string
  updated_at?: string
  theme_preference?: string
  use_system_theme?: boolean
  avatar_url?: string
}

export type GroupCategory = 
  | 'family'
  | 'friends'
  | 'work'
  | 'community'
  | 'hobby'
  | 'travel'
  | 'other'

export type MemberRole = 
  | 'admin'
  | 'moderator'
  | 'member'

export type InvitationStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'

export interface CreateGroupData {
  name: string
  description?: string
  category: GroupCategory
  is_public: boolean
  member_limit?: number
  image_url?: string
}

export interface UpdateGroupData {
  name?: string
  description?: string
  category?: GroupCategory
  is_public?: boolean
  member_limit?: number
  image_url?: string
}

export interface CreateInvitationData {
  group_id: string
  invitee_email: string
}

export interface GroupWithDetails extends Group {
  members: GroupMember[]
  recent_posts: GroupPost[]
  catalogs: GroupCatalog[]
}

export interface GroupCatalog {
  id: string
  title: string
  items: number
  icon: string
  color: string
}
