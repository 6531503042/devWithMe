import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface KanbanCard {
  id: string;
  title: string;
  description: string | null;
  column_id: string;
  position: number;
  tags: string[] | null;
}

interface KanbanColumn {
  id: string;
  title: string;
  board_id: string;
  position: number;
}

interface KanbanBoardProps {
  boardId: string;
}

const KanbanBoard = ({ boardId }: KanbanBoardProps) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addCardColumnId, setAddCardColumnId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardTags, setNewCardTags] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBoardData();
    // eslint-disable-next-line
  }, [boardId]);

  const fetchBoardData = async () => {
    try {
      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('kanban_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position');
      if (columnsError) throw columnsError;
      setColumns(columnsData);
      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('kanban_cards')
        .select('*')
        .in('column_id', columnsData.map(col => col.id))
        .order('position');
      if (cardsError) throw cardsError;
      setCards(cardsData);
    } catch (error) {
      console.error('Error fetching board data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load board data',
        variant: 'destructive'
      });
    }
  };

  // Add Column
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim() || !user) return;
    try {
      const maxPosition = columns.length > 0 ? Math.max(...columns.map(c => c.position)) : 0;
      const { error } = await supabase
        .from('kanban_columns')
        .insert({
          title: newColumnTitle.trim(),
          board_id: boardId,
          position: maxPosition + 1000,
        });
      if (error) throw error;
      setNewColumnTitle('');
      setIsAddColumnOpen(false);
      fetchBoardData();
      toast({ title: 'Column added' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add column',
        variant: 'destructive',
      });
    }
  };

  // Add Card
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !addCardColumnId || !user) return;
    try {
      const columnCards = cards.filter(c => c.column_id === addCardColumnId);
      const maxPosition = columnCards.length > 0 ? Math.max(...columnCards.map(c => c.position)) : 0;
      const tagsArr = newCardTags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await supabase
        .from('kanban_cards')
        .insert({
          title: newCardTitle.trim(),
          description: newCardDescription.trim() || null,
          column_id: addCardColumnId,
          position: maxPosition + 1000,
          tags: tagsArr.length > 0 ? tagsArr : null,
        });
      if (error) throw error;
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardTags('');
      setIsAddCardOpen(false);
      fetchBoardData();
      toast({ title: 'Card added' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add card',
        variant: 'destructive',
      });
    }
  };

  // Drag and drop
  const moveCard = async (cardId: string, targetColumnId: string, newPosition: number) => {
    try {
      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          column_id: targetColumnId,
          position: newPosition,
        })
        .eq('id', cardId);
      if (error) throw error;
      await fetchBoardData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move card',
        variant: 'destructive'
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(card));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const cardData = JSON.parse(e.dataTransfer.getData('text/plain')) as KanbanCard;
    if (cardData.column_id === columnId) return;
    const columnCards = cards.filter(c => c.column_id === columnId);
    const newPosition = columnCards.length > 0 
      ? Math.max(...columnCards.map(c => c.position)) + 1000
      : 1000;
    await moveCard(cardData.id, columnId, newPosition);
  };

  return (
    <>
      <div className="flex gap-4 mb-4">
        <Button variant="outline" onClick={() => setIsAddColumnOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Column
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => (
          <div
            key={column.id}
            className="flex flex-col h-[500px] md:h-[600px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="bg-secondary rounded-t-md p-3 flex justify-between items-center">
              <h3 className="font-medium text-sm">{column.title}</h3>
              <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                {cards.filter(card => card.column_id === column.id).length}
              </span>
            </div>
            <div className="flex-grow overflow-auto bg-secondary/50 rounded-b-md p-2 space-y-2">
              {cards
                .filter(card => card.column_id === column.id)
                .map(card => {
                  // Generate different colors based on card id
                  const colors = ["border-l-primary", "border-l-blue-500", "border-l-green-500", "border-l-amber-500", "border-l-rose-500", "border-l-indigo-500"];
                  const colorIndex = Math.abs(card.id.charCodeAt(0) + card.id.charCodeAt(1)) % colors.length;
                  
                  return (
                    <Card 
                      key={card.id}
                      className={`cursor-move card-hover border-l-4 ${colors[colorIndex]} bg-card shadow-sm`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card)}
                    >
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm">{card.title}</h4>
                        {card.description && (
                          <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                        )}
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.tags.map(tag => (
                              <span 
                                key={tag} 
                                className="text-xs rounded-full bg-secondary px-2 py-0.5 text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              {cards.filter(card => card.column_id === column.id).length === 0 && (
                <div className="flex items-center justify-center h-20 border border-dashed rounded-md border-muted text-muted-foreground text-sm">
                  No cards
                </div>
              )}
              <Button 
                onClick={() => {
                  setAddCardColumnId(column.id);
                  setIsAddCardOpen(true);
                }}
                variant="ghost" 
                className="w-full mt-2 border border-dashed text-muted-foreground"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Card
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddColumn} className="space-y-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="column-title">Column Title</Label>
              <Input
                id="column-title"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="e.g. Backlog"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddColumnOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Column</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCard} className="space-y-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="card-title">Title</Label>
              <Input
                id="card-title"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Card title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-description">Description</Label>
              <Textarea
                id="card-description"
                value={newCardDescription}
                onChange={(e) => setNewCardDescription(e.target.value)}
                placeholder="Card description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-tags">Tags (comma separated)</Label>
              <Input
                id="card-tags"
                value={newCardTags}
                onChange={(e) => setNewCardTags(e.target.value)}
                placeholder="frontend, bug, critical"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddCardOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Card</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KanbanBoard;
