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
import { useKanbanBoards } from '@/hooks/use-cached-data';
import { useQueryClient } from '@tanstack/react-query';

interface KanbanBoardMeta {
  id: string;
  title: string;
}

const KanbanPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    if (!newBoardTitle.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('kanban_boards')
        .insert({
          title: newBoardTitle.trim(),
          user_id: user.id,
        })
        .select();
      if (error) throw error;
      toast({ title: 'Board created', description: 'New board added!' });
      setNewBoardTitle('');
      setIsBoardDialogOpen(false);
      
      // Invalidate the boards query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['kanban_boards', user.id] });
      
      if (data && data.length > 0) setSelectedBoardId(data[0].id);
    } catch (error) {
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
          <div key={colIndex} className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            
            <div className="space-y-3">
              {Array.from({ length: 2 + colIndex % 2 }).map((_, cardIndex) => (
                <Card key={cardIndex} className="relative">
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

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        <PageContainer title="Kanban Board">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="board-select">Board:</Label>
              <Select
                value={selectedBoardId || ''}
                onValueChange={setSelectedBoardId}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setIsBoardDialogOpen(true)}>
                + New Board
              </Button>
            </div>
          </div>

          {selectedBoardId ? (
            isLoading ? (
              <KanbanSkeleton />
            ) : (
              <KanbanBoard 
                boardId={selectedBoardId} 
              />
            )
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No board selected. Create a new board to get started.
            </div>
          )}

          {/* Board Creation Dialog */}
          <Dialog open={isBoardDialogOpen} onOpenChange={setIsBoardDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBoard} className="space-y-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="board-title">Board Title</Label>
                  <Input
                    id="board-title"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    placeholder="e.g. Project Alpha"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsBoardDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Board</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Card</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title"
                    placeholder="Enter card title" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea 
                    id="description"
                    placeholder="Enter description" 
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Card</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageContainer>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default KanbanPage;
