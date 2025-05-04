import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Music, Search, ExternalLink, User, Star, PlayCircle, Filter } from 'lucide-react';
import { useSpotifyAuth } from '@/integrations/spotify/SpotifyAuth';
import { spotifyService, SpotifyPlaylist } from '@/integrations/spotify/SpotifyService';
import SpotifyAuth from '@/integrations/spotify/SpotifyAuth';

interface SpotifyPlaylistSelectorProps {
  onSelectPlaylist: (url: string) => void;
  currentUrl: string;
}

const SpotifyPlaylistSelector: React.FC<SpotifyPlaylistSelectorProps> = ({ 
  onSelectPlaylist,
  currentUrl
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [userPlaylists, setUserPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [focusPlaylists, setFocusPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [searchResults, setSearchResults] = useState<SpotifyPlaylist[]>([]);
  const [activeTab, setActiveTab] = useState('featured');
  
  const { spotifyToken, isAuthenticated } = useSpotifyAuth();
  const { toast } = useToast();
  
  // Extract playlist ID from URL to show selected state
  const extractPlaylistId = (url: string): string | null => {
    if (!url) return null;
    
    try {
      // Handle embed URL
      if (url.includes('/embed/')) {
        const match = url.match(/\/embed\/playlist\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
      }
      
      // Handle regular URL
      if (url.includes('/playlist/')) {
        const match = url.match(/\/playlist\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting playlist ID:', error);
      return null;
    }
  };
  
  const currentPlaylistId = extractPlaylistId(currentUrl);

  // Load playlists when component mounts
  useEffect(() => {
    if (isOpen && isAuthenticated && spotifyToken) {
      loadFeaturedPlaylists();
    }
  }, [isOpen, isAuthenticated, spotifyToken]);
  
  const loadUserPlaylists = async () => {
    if (!isAuthenticated || !spotifyToken) return;
    
    setIsLoading(true);
    try {
      const result = await spotifyService.getUserPlaylists(spotifyToken);
      setUserPlaylists(result.items);
    } catch (error) {
      console.error('Error loading user playlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your playlists. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadFeaturedPlaylists = async () => {
    if (!isAuthenticated || !spotifyToken) return;
    
    setIsLoading(true);
    try {
      const result = await spotifyService.getFeaturedPlaylists(spotifyToken);
      setFeaturedPlaylists(result.playlists.items);
    } catch (error) {
      console.error('Error loading featured playlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load featured playlists. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadFocusPlaylists = async () => {
    if (!isAuthenticated || !spotifyToken) return;
    
    setIsLoading(true);
    try {
      const result = await spotifyService.getStudyPlaylists(spotifyToken);
      setFocusPlaylists(result.playlists.items);
    } catch (error) {
      console.error('Error loading focus playlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load focus playlists. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchInput.trim() || !isAuthenticated || !spotifyToken) return;
    
    setIsLoading(true);
    try {
      const result = await spotifyService.search(spotifyToken, searchInput, ['playlist']);
      if (result.playlists?.items) {
        setSearchResults(result.playlists.items);
        setActiveTab('search');
      }
    } catch (error) {
      console.error('Error searching playlists:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search playlists. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Load data for the selected tab if it hasn't been loaded yet
    if (value === 'user' && userPlaylists.length === 0) {
      loadUserPlaylists();
    } else if (value === 'featured' && featuredPlaylists.length === 0) {
      loadFeaturedPlaylists();
    } else if (value === 'focus' && focusPlaylists.length === 0) {
      loadFocusPlaylists();
    }
  };
  
  const handleSelectPlaylist = (playlist: SpotifyPlaylist) => {
    // Convert the regular URL to the embed URL
    const embedUrl = `https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator&theme=0`;
    onSelectPlaylist(embedUrl);
    
    toast({
      title: 'Playlist Selected',
      description: `Now playing: ${playlist.name}`,
    });
    
    setIsOpen(false);
  };
  
  const renderPlaylistGrid = (playlists: SpotifyPlaylist[]) => {
    if (playlists.length === 0 && !isLoading) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Music className="h-8 w-8 mx-auto mb-2" />
          <p>No playlists found</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
        {playlists.map(playlist => (
          <Card 
            key={playlist.id} 
            className={`cursor-pointer hover:bg-accent/50 transition-all border overflow-hidden ${
              playlist.id === currentPlaylistId ? 'border-primary ring-1 ring-primary' : 'border-border'
            }`}
            onClick={() => handleSelectPlaylist(playlist)}
          >
            <div className="aspect-square overflow-hidden bg-muted relative">
              {playlist.images?.[0]?.url ? (
                <img 
                  src={playlist.images[0].url} 
                  alt={playlist.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <Music className="h-12 w-12 text-secondary-foreground opacity-20" />
                </div>
              )}
              <div 
                className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity`}
              >
                <PlayCircle className="h-12 w-12" />
              </div>
            </div>
            <CardContent className="p-3">
              <div className="truncate font-medium text-sm">{playlist.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {playlist.owner.display_name} • {playlist.tracks.total} tracks
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderAuthPrompt = () => (
    <div className="flex flex-col items-center justify-center py-10">
      <Music className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Connect Your Spotify Account</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        Connect your Spotify account to browse and play your playlists during your Pomodoro sessions.
      </p>
      <SpotifyAuth buttonVariant="default" />
    </div>
  );
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 focus:ring-0"
        onClick={() => setIsOpen(true)}
      >
        <Music className="h-4 w-4" />
        <span>Browse Playlists</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Spotify Playlists</DialogTitle>
          </DialogHeader>
          
          {!isAuthenticated ? (
            renderAuthPrompt()
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search for playlists..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  variant="default" 
                  onClick={handleSearch}
                  disabled={isLoading || !searchInput.trim()}
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="featured" className="text-sm">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </TabsTrigger>
                  <TabsTrigger value="focus" className="text-sm">
                    <Filter className="h-3 w-3 mr-1" />
                    Focus
                  </TabsTrigger>
                  <TabsTrigger value="user" className="text-sm">
                    <User className="h-3 w-3 mr-1" />
                    Your Library
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="featured" className="mt-4">
                  <div className="mb-3 flex justify-between items-center">
                    <h3 className="text-sm font-medium">Featured Playlists</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={loadFeaturedPlaylists}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {isLoading && featuredPlaylists.length === 0 ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : renderPlaylistGrid(featuredPlaylists)}
                </TabsContent>
                
                <TabsContent value="focus" className="mt-4">
                  <div className="mb-3 flex justify-between items-center">
                    <h3 className="text-sm font-medium">Focus & Study Playlists</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={loadFocusPlaylists}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {isLoading && focusPlaylists.length === 0 ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : renderPlaylistGrid(focusPlaylists)}
                </TabsContent>
                
                <TabsContent value="user" className="mt-4">
                  <div className="mb-3 flex justify-between items-center">
                    <h3 className="text-sm font-medium">Your Playlists</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={loadUserPlaylists}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {isLoading && userPlaylists.length === 0 ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : renderPlaylistGrid(userPlaylists)}
                </TabsContent>
                
                <TabsContent value="search" className="mt-4">
                  <div className="mb-3 flex justify-between items-center">
                    <h3 className="text-sm font-medium">
                      {searchResults.length} results for "{searchInput}"
                    </h3>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : renderPlaylistGrid(searchResults)}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end">
                <a 
                  href="https://open.spotify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                >
                  <span>Open Spotify</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SpotifyPlaylistSelector; 