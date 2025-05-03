import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [isLoading, setIsLoading] = useState(true);

  // Drag and drop state
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  useEffect(() => {
    fetchBoardData();
    // eslint-disable-next-line
  }, [boardId]);

  const fetchBoardData = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    // Set data transfer for compatibility
    e.dataTransfer.setData('text/plain', JSON.stringify(card));
    
    // Set opacity on drag image
    if (e.currentTarget instanceof HTMLElement) {
      // Create a semi-transparent drag image
      e.dataTransfer.effectAllowed = 'move';
      
      // Add visual indicator to the dragged element
      setTimeout(() => {
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.classList.add('opacity-60', 'scale-105', 'shadow-lg');
        }
      }, 0);
    }
    
    // Update state to track what's being dragged
    setDraggedCard(card);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Clear drag state
    setDraggedCard(null);
    setActiveColumn(null);
    
    // Remove visual effects from the source element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('opacity-60', 'scale-105', 'shadow-lg');
    }
    
    // Remove active column classes
    document.querySelectorAll('.kanban-column').forEach(column => {
      column.classList.remove('bg-primary/10', 'border-primary');
    });
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Highlight the target column
    if (activeColumn !== columnId) {
      // Remove highlight from previous column
      document.querySelectorAll('.kanban-column').forEach(column => {
        column.classList.remove('bg-primary/10', 'border-primary');
      });
      
      // Highlight current column
      const currentColumn = document.getElementById(`column-${columnId}`);
      if (currentColumn) {
        currentColumn.classList.add('bg-primary/10', 'border-primary');
      }
      
      setActiveColumn(columnId);
    }
  };

  const handleDragEnter = (columnId: string) => {
    setActiveColumn(columnId);
    
    // Apply visual cue to column on drag enter
    document.querySelectorAll('.kanban-column').forEach(col => {
      col.classList.remove('bg-primary/10', 'border-primary');
    });
    
    const columnElement = document.querySelector(`.kanban-column[data-column-id="${columnId}"]`);
    if (columnElement) {
      columnElement.classList.add('bg-primary/10', 'border-primary');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only remove highlight if we're leaving to an element that is not a child
    if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
      e.currentTarget.classList.remove('bg-primary/10', 'border-primary');
    }
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    
    // Get card data from dataTransfer
    const cardData = JSON.parse(e.dataTransfer.getData('text/plain')) as KanbanCard;
    
    // Prevent unnecessary moves within the same column
    if (cardData.column_id === columnId) {
      handleDragEnd(e);
      return;
    }
    
    // Calculate new position for the card
    const columnCards = cards.filter(c => c.column_id === columnId);
    const newPosition = columnCards.length > 0 
      ? Math.max(...columnCards.map(c => c.position)) + 1000
      : 1000;
    
    // Optimistically update the UI to prevent flickering or duplication
    setCards(prevCards => {
      return prevCards.map(card => 
        card.id === cardData.id 
          ? {...card, column_id: columnId, position: newPosition} 
          : card
      );
    });

    try {
      // Update the card in the database
      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          column_id: columnId,
          position: newPosition,
        })
        .eq('id', cardData.id);
      
      if (error) throw error;
      
      // Add visual feedback for successful drop
      const targetElement = document.getElementById(`card-${cardData.id}`);
      if (targetElement) {
        targetElement.classList.add('scale-105');
        setTimeout(() => {
          targetElement.classList.remove('scale-105');
        }, 300);
      }
    } catch (error) {
      console.error('Error moving card:', error);
      toast({
        title: 'Error',
        description: 'Failed to move card',
        variant: 'destructive'
      });
      
      // Revert the UI change if database update failed
      await fetchBoardData();
    }
    
    // Clear drag state
    handleDragEnd(e);
  };

  const KanbanSkeleton = () => (
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
  );

  return (
    <div className="my-4">
      {isLoading ? (
        <KanbanSkeleton />
      ) : (
        <>
          <div className="flex flex-no-wrap overflow-x-auto pb-4 gap-4">
            {columns.map(column => (
              <div
                key={column.id}
                data-column-id={column.id}
                className={`kanban-column flex-shrink-0 w-80 bg-secondary/30 rounded-lg p-4 border-2 border-transparent transition-colors ${
                  activeColumn === column.id ? 'bg-primary/10 border-primary' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragEnter={(e) => handleDragEnter(column.id)}
                onDragLeave={handleDragLeave}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">{column.title}</h3>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setAddCardColumnId(column.id);
                        setIsAddCardOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 min-h-[50px]">
                  {cards
                    .filter(card => card.column_id === column.id)
                    .map(card => (
                      <Card
                        key={card.id}
                        className="relative cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDragEnd={handleDragEnd}
                      >
                        <CardContent className="p-3">
                          <h4 className="font-medium mb-1">{card.title}</h4>
                          {card.description && (
                            <p className="text-sm text-muted-foreground mb-2">{card.description}</p>
                          )}
                          {card.tags && card.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {card.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
                
                <Button
                  variant="ghost"
                  className="w-full mt-3 border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/50"
                  onClick={() => {
                    setAddCardColumnId(column.id);
                    setIsAddCardOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Card
                </Button>
              </div>
            ))}
            
            <div className="flex-shrink-0 w-80">
              {isAddColumnOpen ? (
                <Card className="p-4">
                  <form onSubmit={handleAddColumn}>
                    <Label htmlFor="column-title">Column Title</Label>
                    <Input
                      id="column-title"
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      placeholder="e.g. To Do"
                      className="mb-2"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2 mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddColumnOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm">
                        Add Column
                      </Button>
                    </div>
                  </form>
                </Card>
              ) : (
                <Button
                  variant="outline"
                  className="h-auto py-8 px-4 w-full border-dashed"
                  onClick={() => setIsAddColumnOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" /> Add Column
                </Button>
              )}
            </div>
          </div>
        </>
      )}

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
              <Label htmlFor="card-description">Description (optional)</Label>
              <Textarea
                id="card-description"
                value={newCardDescription}
                onChange={(e) => setNewCardDescription(e.target.value)}
                placeholder="Card description"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="card-tags">Tags (comma separated, optional)</Label>
              <Input
                id="card-tags"
                value={newCardTags}
                onChange={(e) => setNewCardTags(e.target.value)}
                placeholder="frontend, bug, urgent"
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
    </div>
  );
};

export default KanbanBoard;
