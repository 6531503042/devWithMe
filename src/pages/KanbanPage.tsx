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

interface KanbanBoardMeta {
  id: string;
  title: string;
}

const KanbanPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);
  const [boards, setBoards] = useState<KanbanBoardMeta[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchBoards();
  }, [user]);

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at');
      if (error) throw error;
      setBoards(data || []);
      if (data && data.length > 0 && !selectedBoardId) {
        setSelectedBoardId(data[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load boards',
        variant: 'destructive',
      });
    }
  };

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
      fetchBoards();
      if (data && data.length > 0) setSelectedBoardId(data[0].id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create board',
        variant: 'destructive',
      });
    }
  };

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
            <KanbanBoard 
              onAddCard={() => setIsDialogOpen(true)} 
              boardId={selectedBoardId} 
            />
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
                    placeholder="Card title"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    placeholder="Card description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date (optional)</Label>
                    <Input 
                      id="dueDate"
                      type="date"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input 
                      id="tags"
                      placeholder="frontend, bug, critical"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={() => setIsDialogOpen(false)}>Add Card</Button>
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
