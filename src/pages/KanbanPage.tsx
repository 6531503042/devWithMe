import React, { useState, useEffect } from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useKanbanBoards, KanbanBoard as KanbanBoardType } from '@/hooks/use-cached-data';
import { useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trello, Settings, BookOpen, Info, Layers, LayoutGrid, Eye, CheckCircle } from 'lucide-react';

interface KanbanBoardMeta {
  id: string;
  title: string;
  color?: string;
  description?: string;
  user_id?: string;
}

const KanbanPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [boardColor, setBoardColor] = useState<string>('#7c3aed'); // Default color is purple
  const [boardDescription, setBoardDescription] = useState('');
  const [viewMode, setViewMode] = useState<'compact' | 'comfortable'>('comfortable');
  const [isTitleError, setIsTitleError] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Available board colors
  const boardColors = [
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
  ];
  
  // Use our new hook to fetch and cache kanban boards data
  const { 
    data: boards = [],
    isLoading,
    error,
    refetch
  } = useKanbanBoards();

  // Set the first board as selected if we've loaded boards and none is selected
  useEffect(() => {
    if (boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate title - if empty, show error and apply shake animation
    if (!newBoardTitle.trim()) {
      setIsTitleError(true);
      // Reset error state after animation completes
      setTimeout(() => setIsTitleError(false), 600);
      return;
    }
    
    if (!user) return;
    
    try {
      // Only insert fields that exist in the database schema
      const { data, error } = await supabase
        .from('kanban_boards')
        .insert({
          title: newBoardTitle.trim(),
          user_id: user.id
        })
        .select();
      if (error) throw error;
      toast({ 
        title: 'Board created', 
        description: 'New board added successfully!' 
      });
      setNewBoardTitle('');
      setBoardDescription('');
      setIsBoardDialogOpen(false);
      
      // Invalidate the boards query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['kanban_boards', user.id] });
      
      if (data && data.length > 0) setSelectedBoardId(data[0].id);
    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: 'Error',
        description: 'Failed to create board',
        variant: 'destructive',
      });
    }
  };

  const KanbanSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((colIndex) => (
          <div key={colIndex} className="bg-secondary/30 rounded-lg p-4 border border-muted">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            
            <div className="space-y-3">
              {Array.from({ length: 2 + colIndex % 2 }).map((_, cardIndex) => (
                <Card key={cardIndex} className="relative border border-muted/60">
                  <CardContent className="p-3">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-3" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-3">
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Handle errors from the data fetch
  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load boards. Please try again.',
      variant: 'destructive',
    });
  }

  // Get current board color
  const getCurrentBoardColor = () => {
    if (!selectedBoardId) return '#7c3aed';
    const board = boards.find(b => b.id === selectedBoardId);
    return board?.color || '#7c3aed';
  };

  const getCurrentBoard = () => {
    return boards.find(b => b.id === selectedBoardId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      {/* Add the style tag for animations */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <main className="flex-1 overflow-hidden">
        <div 
          className="py-4 px-8 bg-gradient-to-r" 
          style={{ 
            backgroundImage: `linear-gradient(to right, ${getCurrentBoardColor()}15, ${getCurrentBoardColor()}02)` 
          }}
        >
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Trello className="h-5 w-5" style={{ color: getCurrentBoardColor() }} />
                  <span>Kanban Board</span>
                </h1>
                {getCurrentBoard()?.description && (
                  <p className="text-muted-foreground text-sm mt-1 max-w-md">
                    {getCurrentBoard()?.description}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 flex-1">
                  <Label htmlFor="board-select" className="whitespace-nowrap">Board:</Label>
                  <Select
                    value={selectedBoardId || ''}
                    onValueChange={setSelectedBoardId}
                  >
                    <SelectTrigger 
                      className="min-w-[180px] border border-muted"
                      style={{ borderLeftColor: getCurrentBoardColor(), borderLeftWidth: '3px' }}
                    >
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {boards.map((board) => (
                        <SelectItem 
                          key={board.id} 
                          value={board.id} 
                          className="flex items-center gap-2"
                        >
                          <div 
                            className="h-3 w-3 rounded-full inline-block mr-2" 
                            style={{ backgroundColor: board.color || '#7c3aed' }}
                          ></div>
                          {board.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={() => setIsBoardDialogOpen(true)}
                    className="gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Create Project</span>
                    <span className="inline sm:hidden">New</span>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="px-2 sm:px-3" 
                    onClick={() => setViewMode(viewMode === 'comfortable' ? 'compact' : 'comfortable')}
                    title={viewMode === 'comfortable' ? 'Switch to compact view' : 'Switch to comfortable view'}
                  >
                    {viewMode === 'comfortable' ? (
                      <LayoutGrid className="h-4 w-4" />
                    ) : (
                      <Layers className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <PageContainer className="pt-4">
          {selectedBoardId ? (
            isLoading ? (
              <KanbanSkeleton />
            ) : (
              <KanbanBoard 
                boardId={selectedBoardId} 
                boardColor={getCurrentBoardColor()}
                viewMode={viewMode}
              />
            )
          ) : (
            <div className="text-center py-16 bg-gradient-to-b from-muted/30 to-muted/10 rounded-2xl border border-dashed border-muted">
              <div className="max-w-md mx-auto px-4">
                <div className="bg-primary/10 text-primary p-4 w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center">
                  <Trello className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Create your first Kanban board</h3>
                <p className="text-muted-foreground mb-6">
                  Organize your tasks and projects with a visual board. Track progress, collaborate with your team, and boost your productivity.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
                  <div className="p-4 bg-card/80 rounded-lg border">
                    <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mb-3">
                      <PlusCircle className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">Create a board</h4>
                    <p className="text-sm text-muted-foreground">Start with a fresh kanban board for your project</p>
                  </div>
                  
                  <div className="p-4 bg-card/80 rounded-lg border">
                    <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mb-3">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">Add columns</h4>
                    <p className="text-sm text-muted-foreground">Create workflow stages like "To Do", "In Progress", "Done"</p>
                  </div>
                  
                  <div className="p-4 bg-card/80 rounded-lg border">
                    <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">Track tasks</h4>
                    <p className="text-sm text-muted-foreground">Add cards to columns and move them as work progresses</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setIsBoardDialogOpen(true)}
                  size="lg"
                  className="px-8"
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> Create New Board
                </Button>
              </div>
            </div>
          )}

          {/* Board Creation Dialog with Stepper */}
          <Dialog open={isBoardDialogOpen} onOpenChange={setIsBoardDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Create New Project Board</DialogTitle>
              </DialogHeader>
              
              <div className="flex items-center justify-between mb-6 mt-3">
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-primary text-white w-6 h-6 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <span className="text-sm font-medium">Basics</span>
                </div>
                <div className="h-[2px] w-12 bg-muted"></div>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-muted text-muted-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <span className="text-sm text-muted-foreground">Customize</span>
                </div>
                <div className="h-[2px] w-12 bg-muted"></div>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-muted text-muted-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <span className="text-sm text-muted-foreground">Columns</span>
                </div>
              </div>
              
              <form onSubmit={handleCreateBoard} className="space-y-5">
                <div className="space-y-5">
                  <div className="grid gap-3">
                    <Label htmlFor="board-title" className="text-base">Project Title</Label>
                    <Input
                      id="board-title"
                      value={newBoardTitle}
                      onChange={(e) => setNewBoardTitle(e.target.value)}
                      placeholder="e.g. Marketing Campaign 2023"
                      required
                      className={`border-input h-10 ${isTitleError ? 'border-red-500 animate-shake' : ''}`}
                    />
                    {isTitleError && (
                      <p className="text-sm text-red-500">Project title is required</p>
                    )}
                    <p className="text-sm text-muted-foreground">Give your project a clear, descriptive name</p>
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="board-description" className="text-base">Description</Label>
                    <Textarea
                      id="board-description"
                      value={boardDescription}
                      onChange={(e) => setBoardDescription(e.target.value)}
                      placeholder="Describe the purpose of this project board..."
                      className="border-input resize-none"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">Help team members understand the board's purpose</p>
                  </div>
                  
                  <div className="grid gap-3">
                    <Label className="text-base">Choose a Color</Label>
                    <div className="flex flex-wrap gap-3">
                      {boardColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                            boardColor === color.value ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setBoardColor(color.value)}
                          title={color.name}
                        >
                          {boardColor === color.value && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Color coding helps visually distinguish between boards</p>
                  </div>
                </div>
                
                <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsBoardDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Project Board
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Project Management UI with proper styling */}
          {boards.length > 0 && (
            <div className="mt-8 mb-4">
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>Your Projects</span>
                <div className="hidden md:block">
                  <Button 
                    size="sm" 
                    onClick={() => setIsBoardDialogOpen(true)}
                    variant="outline"
                    className="gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create New Project</span>
                  </Button>
                </div>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {boards.map((board) => (
                  <div 
                    key={board.id}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all duration-200
                      ${selectedBoardId === board.id ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}
                    `}
                    style={{ 
                      borderLeftColor: board.color || '#7c3aed',
                      borderLeftWidth: '4px'
                    }}
                    onClick={() => setSelectedBoardId(board.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium truncate">{board.title}</h3>
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: board.color || '#7c3aed' }}
                      ></div>
                    </div>
                    {board.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{board.description}</p>
                    )}
                    <div className="flex justify-end mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBoardId(board.id);
                        }}
                      >
                        <Trello className="h-4 w-4 mr-1" />
                        <span className="text-xs">View Board</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PageContainer>
      </main>
    </div>
  );
};

// Add the shake animation CSS class
const styles = `
@keyframes shake {
  0% { transform: translateX(0); }
  10% { transform: translateX(-5px); }
  20% { transform: translateX(5px); }
  30% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  50% { transform: translateX(-5px); }
  60% { transform: translateX(5px); }
  70% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
  90% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

.animate-shake {
  animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
}
`;

export default KanbanPage;
