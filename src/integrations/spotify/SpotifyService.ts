import { SpotifyTokenData } from './SpotifyAuth';

// Types for Spotify API responses
export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: {url: string}[];
  product: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: {url: string}[];
  external_urls: {spotify: string};
  tracks: {total: number};
  owner: {display_name: string};
  uri: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: {id: string; name: string}[];
  album: {
    id: string;
    name: string;
    images: {url: string}[];
  };
  duration_ms: number;
  uri: string;
}

class SpotifyService {
  private baseUrl = 'https://api.spotify.com/v1';
  
  async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    token: SpotifyTokenData,
    body?: any
  ): Promise<T> {
    try {
      const headers: HeadersInit = {
        'Authorization': `${token.token_type} ${token.access_token}`,
        'Content-Type': 'application/json',
      };
      
      const options: RequestInit = {
        method,
        headers,
      };
      
      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Spotify API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      // For 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error calling Spotify API (${endpoint}):`, error);
      throw error;
    }
  }
  
  // Get current user profile
  async getCurrentUser(token: SpotifyTokenData): Promise<SpotifyUser> {
    return this.makeRequest<SpotifyUser>('/me', 'GET', token);
  }
  
  // Get user's playlists
  async getUserPlaylists(token: SpotifyTokenData, limit = 50, offset = 0): Promise<{items: SpotifyPlaylist[], total: number}> {
    return this.makeRequest<{items: SpotifyPlaylist[], total: number}>(
      `/me/playlists?limit=${limit}&offset=${offset}`, 
      'GET', 
      token
    );
  }
  
  // Get a specific playlist
  async getPlaylist(token: SpotifyTokenData, playlistId: string): Promise<SpotifyPlaylist> {
    return this.makeRequest<SpotifyPlaylist>(
      `/playlists/${playlistId}`, 
      'GET', 
      token
    );
  }
  
  // Get tracks in a playlist
  async getPlaylistTracks(
    token: SpotifyTokenData, 
    playlistId: string, 
    limit = 100, 
    offset = 0
  ): Promise<{items: {track: SpotifyTrack}[], total: number}> {
    return this.makeRequest<{items: {track: SpotifyTrack}[], total: number}>(
      `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, 
      'GET', 
      token
    );
  }
  
  // Get featured playlists
  async getFeaturedPlaylists(token: SpotifyTokenData, limit = 20): Promise<{playlists: {items: SpotifyPlaylist[]}}> {
    return this.makeRequest<{playlists: {items: SpotifyPlaylist[]}}>(
      `/browse/featured-playlists?limit=${limit}`, 
      'GET', 
      token
    );
  }
  
  // Get user's top artists and tracks
  async getUserTopItems(
    token: SpotifyTokenData, 
    type: 'artists' | 'tracks', 
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit = 10
  ): Promise<{items: any[]}> {
    return this.makeRequest<{items: any[]}>(
      `/me/top/${type}?time_range=${timeRange}&limit=${limit}`, 
      'GET', 
      token
    );
  }
  
  // Get recommended tracks based on seed artists, tracks, or genres
  async getRecommendations(
    token: SpotifyTokenData,
    options: {
      seed_artists?: string[],
      seed_tracks?: string[],
      seed_genres?: string[],
      limit?: number,
      target_energy?: number,
      target_danceability?: number,
      target_tempo?: number
    }
  ): Promise<{tracks: SpotifyTrack[]}> {
    // Build query string
    const params = new URLSearchParams();
    
    if (options.seed_artists?.length) {
      params.append('seed_artists', options.seed_artists.join(','));
    }
    
    if (options.seed_tracks?.length) {
      params.append('seed_tracks', options.seed_tracks.join(','));
    }
    
    if (options.seed_genres?.length) {
      params.append('seed_genres', options.seed_genres.join(','));
    }
    
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    
    if (options.target_energy !== undefined) {
      params.append('target_energy', options.target_energy.toString());
    }
    
    if (options.target_danceability !== undefined) {
      params.append('target_danceability', options.target_danceability.toString());
    }
    
    if (options.target_tempo !== undefined) {
      params.append('target_tempo', options.target_tempo.toString());
    }
    
    return this.makeRequest<{tracks: SpotifyTrack[]}>(
      `/recommendations?${params.toString()}`, 
      'GET', 
      token
    );
  }
  
  // Get playlists from a specific category
  async getCategoryPlaylists(
    token: SpotifyTokenData,
    categoryId: string,
    limit = 20,
    offset = 0
  ): Promise<{playlists: {items: SpotifyPlaylist[]}}> {
    return this.makeRequest<{playlists: {items: SpotifyPlaylist[]}}>(
      `/browse/categories/${categoryId}/playlists?limit=${limit}&offset=${offset}`,
      'GET',
      token
    );
  }
  
  // Search for items
  async search(
    token: SpotifyTokenData,
    query: string,
    types: Array<'album' | 'artist' | 'playlist' | 'track'>,
    limit = 20,
    offset = 0
  ): Promise<{
    albums?: {items: any[]},
    artists?: {items: any[]},
    playlists?: {items: SpotifyPlaylist[]},
    tracks?: {items: SpotifyTrack[]}
  }> {
    const typeString = types.join(',');
    return this.makeRequest<any>(
      `/search?q=${encodeURIComponent(query)}&type=${typeString}&limit=${limit}&offset=${offset}`,
      'GET',
      token
    );
  }
  
  // Get a list of categories
  async getCategories(
    token: SpotifyTokenData,
    limit = 20,
    offset = 0
  ): Promise<{categories: {items: {id: string, name: string, icons: {url: string}[]}[]}}> {
    return this.makeRequest<{categories: {items: {id: string, name: string, icons: {url: string}[]}[]}}>(
      `/browse/categories?limit=${limit}&offset=${offset}`,
      'GET',
      token
    );
  }
  
  // Get study-focused playlists (searches for "study", "focus", "concentration", etc.)
  async getStudyPlaylists(token: SpotifyTokenData, limit = 10): Promise<{playlists: {items: SpotifyPlaylist[]}}> {
    const queries = ["study", "focus", "concentration", "work", "productivity"];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    
    const result = await this.search(token, randomQuery, ['playlist'], limit);
    return { playlists: result.playlists || { items: [] } };
  }
}

// Export as a singleton
export const spotifyService = new SpotifyService(); 