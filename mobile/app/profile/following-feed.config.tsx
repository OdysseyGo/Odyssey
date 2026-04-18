export interface FollowingFeedItem {
  id: number;
  user: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  tour: {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    duration_minutes: number;
    city?: string;
    cover_image?: string;
    created_at: string;
  };
  completed_at: string;
}

export interface FollowingFeedResponse {
  count: number;
  next?: string;
  previous?: string;
  results: FollowingFeedItem[];
}