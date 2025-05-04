import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  X, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Check, 
  ChevronDown,
  Tag,
  Clock,
  LayoutGrid,
  AlignJustify,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface KanbanCard {
  id: string;
  title: string;
  description: string | null;
  column_id: string;
  position: number;
  tags: string[] | null;
  due_date?: string | null;
}

interface KanbanColumn {
  id: string;
  title: string;
  board_id: string;
  position: number;
}

interface KanbanBoardProps {
  boardId: string;
  boardColor?: string;
  viewMode?: 'compact' | 'comfortable';
}

const KanbanBoard = ({ boardId, boardColor = '#7c3aed', viewMode = 'comfortable' }: KanbanBoardProps) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isDeleteCardOpen, setIsDeleteCardOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addCardColumnId, setAddCardColumnId] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardTags, setNewCardTags] = useState('');
  const [newCardDueDate, setNewCardDueDate] = useState('');
  const [currentCard, setCurrentCard] = useState<KanbanCard | null>(null);
  const [isTitleError, setIsTitleError] = useState(false);
  const [isColumnTitleError, setIsColumnTitleError] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  // Drag and drop state
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  // Tag color generator - generates consistent colors for the same tag names
  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-amber-100 text-amber-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-emerald-100 text-emerald-800',
    ];
    
    // Simple hash function to get a consistent index
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = ((hash << 5) - hash) + tag.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    hash = Math.abs(hash);
    return colors[hash % colors.length];
  };

  // Format due date to a readable format
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Check if a date is in the past
  const isOverdue = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Determine date badge color based on due status
  const getDueDateBadgeColor = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    if (isOverdue(dateString)) {
      return 'bg-red-100 text-red-800';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    // Due today
    if (dueDate.getTime() === today.getTime()) {
      return 'bg-amber-100 text-amber-800';
    }
    
    // Due tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dueDate.getTime() === tomorrow.getTime()) {
      return 'bg-amber-50 text-amber-800';
    }
    
    // Future date
    return 'bg-gray-100 text-gray-800';
  };

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
    
    if (!newColumnTitle.trim()) {
      setIsColumnTitleError(true);
      setTimeout(() => setIsColumnTitleError(false), 600);
      return;
    }
    
    if (!user) return;
    
    // Disable the form while submitting
    setIsSubmitting(true);
    
    try {
      // Check if a column with the same title already exists to prevent duplicates
      const existingColumn = columns.find(
        col => col.title.toLowerCase() === newColumnTitle.trim().toLowerCase()
      );
      
      if (existingColumn) {
        toast({
          title: 'Column already exists',
          description: 'A column with this name already exists on this board.',
          variant: 'destructive',
        });
        return;
      }
      
      console.log(`Adding new column: ${newColumnTitle}`);
      
      // Calculate next position based on existing columns
      const maxPosition = columns.length > 0 
        ? Math.max(...columns.map(c => c.position)) 
        : 0;
      
      const { error } = await supabase
        .from('kanban_columns')
        .insert({
          title: newColumnTitle.trim(),
          board_id: boardId,
          position: maxPosition + 1000,
        });
        
      if (error) throw error;
      
      // Reset form state
      setNewColumnTitle('');
      setIsAddColumnOpen(false);
      
      // Refresh board data
      fetchBoardData();
      
      // Provide user feedback
      toast({ 
        title: 'Column added',
        description: 'New column added successfully!'
      });
    } catch (error) {
      console.error('Error adding column:', error);
      toast({
        title: 'Error',
        description: 'Failed to add column',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Card
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) {
      setIsTitleError(true);
      setTimeout(() => setIsTitleError(false), 600);
      return;
    }
    
    if (!addCardColumnId || !user) return;
    
    // Disable the form while submitting
    setIsSubmitting(true);
    
    try {
      // Check if a card with the same title already exists in this column
      const existingCard = cards.find(
        card => card.column_id === addCardColumnId && 
        card.title.toLowerCase() === newCardTitle.trim().toLowerCase()
      );
      
      if (existingCard) {
        toast({
          title: 'Card already exists',
          description: 'A card with this name already exists in this column.',
          variant: 'destructive',
        });
        return;
      }
      
      console.log(`Adding new card: ${newCardTitle} to column: ${addCardColumnId}`);
      
      // Calculate next position based on existing cards in the column
      const columnCards = cards.filter(c => c.column_id === addCardColumnId);
      const maxPosition = columnCards.length > 0 
        ? Math.max(...columnCards.map(c => c.position)) 
        : 0;
      
      const tagsArr = newCardTags.split(',').map(t => t.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('kanban_cards')
        .insert({
          title: newCardTitle.trim(),
          description: newCardDescription.trim() || null,
          column_id: addCardColumnId,
          position: maxPosition + 1000,
          tags: tagsArr.length > 0 ? tagsArr : null,
          due_date: newCardDueDate || null
        });
        
      if (error) throw error;
      
      // Reset form states
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardTags('');
      setNewCardDueDate('');
      setIsAddCardOpen(false);
      
      // Refresh board data
      fetchBoardData();
      toast({ 
        title: 'Card added',
        description: 'New card added successfully!'
      });
    } catch (error) {
      console.error('Error adding card:', error);
      toast({
        title: 'Error',
        description: 'Failed to add card',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Card
  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) {
      setIsTitleError(true);
      setTimeout(() => setIsTitleError(false), 600);
      return;
    }
    
    if (!currentCard || !user) return;
    
    try {
      const tagsArr = newCardTags.split(',').map(t => t.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('kanban_cards')
        .update({
          title: newCardTitle.trim(),
          description: newCardDescription.trim() || null,
          tags: tagsArr.length > 0 ? tagsArr : null,
          due_date: newCardDueDate || null
        })
        .eq('id', currentCard.id);
        
      if (error) throw error;
      
      setIsEditCardOpen(false);
      fetchBoardData();
      toast({ 
        title: 'Card updated',
        description: 'Card has been updated successfully!' 
      });
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: 'Error',
        description: 'Failed to update card',
        variant: 'destructive',
      });
    }
  };

  // Delete Card - ensure dialog is fully unmounted before performing operations
  const handleDeleteCard = async () => {
    if (!currentCard || !user) return;
    
    try {
      // Store card ID for deletion after dialog is fully closed
      const cardId = currentCard.id;
      
      // Reset all references that could be holding on to the soon-to-be-deleted card
      setCurrentCard(null);
      setDraggedCard(null);
      setActiveColumn(null);
      
      // Close dialog and wait for it to fully unmount 
      setIsDeleteCardOpen(false);
      
      // The key part - give Radix UI time to unmount dialog completely (300ms is typical animation duration)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force cleanup any stuck dialog overlays
      forceCleanupDialogOverlays();
      
      // Now perform the delete operation
      const { error } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', cardId);
        
      if (error) throw error;
      
      // Refresh the board data
      await fetchBoardData();
      
      toast({ 
        title: 'Card deleted',
        description: 'Card has been removed'
      });
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete card',
        variant: 'destructive'
      });
    }
  };

  // Add a utility function to force cleanup any stuck Radix UI dialog overlays
  const forceCleanupDialogOverlays = () => {
    try {
      // Fix body scroll lock if present
      document.documentElement.style.pointerEvents = 'auto';
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = '';
      
      // Find and remove any stuck dialog overlays
      const dialogOverlays = document.querySelectorAll(
        '[role="dialog"], [data-state="open"], [data-radix-portal], .fixed.inset-0'
      );
      
      dialogOverlays.forEach(el => {
        if (el instanceof HTMLElement) {
          // First try to make it non-blocking
          el.style.pointerEvents = 'none';
          el.setAttribute('aria-hidden', 'true');
          
          // If it's a portal root, try to clean it up more thoroughly
          if (el.hasAttribute('data-radix-portal')) {
            el.style.display = 'none';
            // Try to force remove from DOM - use with caution
            setTimeout(() => {
              if (el.parentNode) {
                try {
                  el.parentNode.removeChild(el);
                } catch (err) {
                  console.warn('Could not remove portal element:', err);
                }
              }
            }, 100);
          }
        }
      });
      
      // Reset any global overlay styles that might be stuck
      const overlays = document.querySelectorAll('.fixed.inset-0, [aria-hidden="true"]');
      overlays.forEach(overlay => {
        if (overlay instanceof HTMLElement) {
          overlay.style.display = 'none';
        }
      });
    } catch (err) {
      console.warn('Error during overlay cleanup:', err);
    }
  };

  // Open edit card dialog
  const openEditCardDialog = (card: KanbanCard) => {
    setCurrentCard(card);
    setNewCardTitle(card.title);
    setNewCardDescription(card.description || '');
    setNewCardTags(card.tags ? card.tags.join(', ') : '');
    setNewCardDueDate(card.due_date || '');
    setIsEditCardOpen(true);
  };

  // Open delete card dialog
  const openDeleteCardDialog = (card: KanbanCard) => {
    setCurrentCard(card);
    setIsDeleteCardOpen(true);
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
    try {
      // Set data transfer for compatibility
      e.dataTransfer.setData('text/plain', JSON.stringify(card));
      
      // Set opacity on drag image
      if (e.currentTarget instanceof HTMLElement) {
        // Create a semi-transparent drag image
        e.dataTransfer.effectAllowed = 'move';
        
        // Add visual indicator to the dragged element
        setTimeout(() => {
          try {
            if (e.currentTarget instanceof HTMLElement && document.body.contains(e.currentTarget)) {
              e.currentTarget.classList.add('opacity-60', 'scale-105', 'shadow-lg');
            }
          } catch (err) {
            console.warn('Failed to apply drag styles:', err);
          }
        }, 0);
      }
      
      // Update state to track what's being dragged
      setDraggedCard(card);
    } catch (err) {
      console.error('Error starting drag operation:', err);
      // Reset drag state to be safe
      setDraggedCard(null);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    try {
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
    } catch (err) {
      console.warn('Error ending drag operation:', err);
      // Force reset drag state
      setDraggedCard(null);
      setActiveColumn(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    try {
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
        if (currentColumn && document.body.contains(currentColumn)) {
          currentColumn.classList.add('bg-primary/10', 'border-primary');
        }
        
        setActiveColumn(columnId);
      }
    } catch (err) {
      console.warn('Error in drag over handler:', err);
    }
  };

  const handleDragEnter = (columnId: string) => {
    try {
      setActiveColumn(columnId);
      
      // Apply visual cue to column on drag enter
      document.querySelectorAll('.kanban-column').forEach(col => {
        col.classList.remove('bg-primary/10', 'border-primary');
      });
      
      const columnElement = document.querySelector(`.kanban-column[data-column-id="${columnId}"]`);
      if (columnElement && document.body.contains(columnElement)) {
        columnElement.classList.add('bg-primary/10', 'border-primary');
      }
    } catch (err) {
      console.warn('Error in drag enter handler:', err);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    try {
      // Only remove highlight if we're leaving to an element that is not a child
      if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
        e.currentTarget.classList.remove('bg-primary/10', 'border-primary');
      }
    } catch (err) {
      console.warn('Error in drag leave handler:', err);
    }
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    
    // Get card data from dataTransfer
    let cardData: KanbanCard; 
    try {
      cardData = JSON.parse(e.dataTransfer.getData('text/plain')) as KanbanCard;
      // If the card doesn't exist anymore, exit early
      if (!cardData || !cardData.id) {
        handleDragEnd(e);
        return;
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
      handleDragEnd(e);
      return;
    }
    
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
      
      // Add visual feedback for successful drop - with error handling
      try {
        const targetElement = document.getElementById(`card-${cardData.id}`);
        if (targetElement) {
          targetElement.classList.add('scale-105');
          setTimeout(() => {
            try {
              if (targetElement && document.body.contains(targetElement)) {
                targetElement.classList.remove('scale-105');
              }
            } catch (styleError) {
              console.warn('Failed to remove scale effect:', styleError);
            }
          }, 300);
        }
      } catch (domError) {
        console.warn('Failed to apply drop animation:', domError);
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

  // Add an effect for global Escape key handling
  useEffect(() => {
    // Handle Escape key to force close any stuck dialogs
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Force cleanup any stuck dialog overlays
        forceCleanupDialogOverlays();
        
        // Reset all modal/dialog states
        setIsAddColumnOpen(false);
        setIsAddCardOpen(false);
        setIsEditCardOpen(false);
        setIsDeleteCardOpen(false);
        
        // Reset all drag states
        setDraggedCard(null);
        setActiveColumn(null);
        
        // Reset card states
        setCurrentCard(null);
      }
    };
    
    // Add the event listener
    document.addEventListener('keydown', handleEscapeKey);
    
    // Cleanup on component unmount
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Additional cleanup to prevent stuck dialogs when navigating away
      forceCleanupDialogOverlays();
      
      // Reset all other states as done in previous cleanup
      setIsAddColumnOpen(false);
      setIsAddCardOpen(false);
      setIsEditCardOpen(false);
      setIsDeleteCardOpen(false);
      setDraggedCard(null);
      setActiveColumn(null);
      setCurrentCard(null);
      setAddCardColumnId('');
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardTags('');
      setNewCardDueDate('');
    };
  }, []);

  return (
    <div className="my-4">
      {/* Add CSS for shake animation */}
      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />
      
      {isLoading ? (
        <KanbanSkeleton />
      ) : (
        <>
          <div className="flex flex-no-wrap overflow-x-auto pb-6 gap-4 touch-pan-x kanban-container">
            {columns.map(column => (
              <div
                key={column.id}
                id={`column-${column.id}`}
                data-column-id={column.id}
                className={`kanban-column flex-shrink-0 w-72 sm:w-80 bg-card rounded-lg shadow-sm ${
                  activeColumn === column.id 
                    ? 'ring-1 ring-primary ring-offset-0' 
                    : 'border border-muted'
                } transition-all overflow-hidden`}
                style={{
                  borderTopColor: boardColor,
                  borderTopWidth: '3px',
                }}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragEnter={(e) => handleDragEnter(column.id)}
                onDragLeave={handleDragLeave}
              >
                <div className="sticky top-0 z-10 px-3 py-3 mb-2 backdrop-blur-sm bg-background/80 rounded-t-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: boardColor }}
                    ></span>
                    <h3 className="font-medium">{column.title}</h3>
                    <Badge variant="outline" className="ml-1 text-xs font-normal">
                      {cards.filter(card => card.column_id === column.id).length}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAddCardColumnId(column.id);
                        setIsAddCardOpen(true);
                      }}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 min-h-[50px] px-3 pb-3 max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {cards
                      .filter(card => card.column_id === column.id)
                      .length > 0 ? (
                        cards
                          .filter(card => card.column_id === column.id)
                          .map(card => (
                            <motion.div
                              key={card.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card
                                id={`card-${card.id}`}
                                className={`relative cursor-move group hover:ring-1 hover:ring-primary/20 hover:shadow-md transition-all duration-150 ${
                                  viewMode === 'compact' ? 'mb-2' : 'mb-3'
                                }`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, card)}
                                onDragEnd={handleDragEnd}
                              >
                                <CardContent className={`${viewMode === 'compact' ? 'p-2' : 'p-3'} pr-8`}>
                                  <h4 className={`font-medium mb-1 ${viewMode === 'compact' ? 'text-sm' : ''}`}>{card.title}</h4>
                                  
                                  {viewMode !== 'compact' && card.description && (
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{card.description}</p>
                                  )}
                                  
                                  {/* Metadata section */}
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {/* Due date */}
                                    {card.due_date && (
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs px-1.5 flex items-center gap-1 ${getDueDateBadgeColor(card.due_date)}`}
                                      >
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDueDate(card.due_date)}</span>
                                      </Badge>
                                    )}
                                    
                                    {/* Tags */}
                                    {card.tags && card.tags.length > 0 && viewMode !== 'compact' && (
                                      <div className="flex flex-wrap gap-1 w-full mt-1">
                                        {card.tags.slice(0, 3).map((tag, i) => (
                                          <Badge
                                            key={i}
                                            variant="secondary"
                                            className={`text-xs px-1.5 truncate max-w-[100px] ${getTagColor(tag)}`}
                                          >
                                            {tag}
                                          </Badge>
                                        ))}
                                        {card.tags.length > 3 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{card.tags.length - 3}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openEditCardDialog(card);
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          openDeleteCardDialog(card);
                                        }}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))
                      ) : (
                        // Empty state for columns with no cards - add with motion fade-in
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="flex flex-col items-center justify-center py-6 px-3 text-center border border-dashed border-muted rounded-lg mt-2">
                            <div className="bg-muted/40 rounded-full w-10 h-10 flex items-center justify-center mb-3">
                              <Plus className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">No cards yet</h4>
                            <p className="text-xs text-muted-foreground mb-3">
                              Add a card to get started with this column
                            </p>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAddCardColumnId(column.id);
                                setIsAddCardOpen(true);
                              }}
                            >
                              Add Card
                            </Button>
                          </div>
                        </motion.div>
                      )
                    }
                  </AnimatePresence>
                </div>
                
                <div className="px-3 pb-3">
                  <Button
                    variant="outline"
                    className="w-full mt-1 border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-primary/5 text-sm gap-1 h-9"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAddCardColumnId(column.id);
                      setIsAddCardOpen(true);
                    }}
                    type="button"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Card
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex-shrink-0 w-72 sm:w-80">
              {isAddColumnOpen ? (
                <Card className="p-4 border border-primary/20 shadow-md bg-card">
                  <form onSubmit={handleAddColumn}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="column-title" className="text-sm font-medium">Column Title</Label>
                        <Input
                          id="column-title"
                          value={newColumnTitle}
                          onChange={(e) => setNewColumnTitle(e.target.value)}
                          placeholder="e.g. To Do, In Progress, Done"
                          className={`mt-1.5 border-input ${isColumnTitleError ? 'border-red-500 animate-shake' : ''}`}
                          autoFocus
                        />
                        {isColumnTitleError && (
                          <p className="text-sm text-red-500">Column title is required</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1.5">Name your column based on its status or purpose</p>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit" disabled={!newColumnTitle.trim()}>
                          Add Column
                        </Button>
                      </DialogFooter>
                    </div>
                  </form>
                </Card>
              ) : (
                <Button
                  variant="outline"
                  className="h-auto py-8 px-4 w-full border-dashed bg-muted/20 hover:bg-muted/30 hover:border-primary/30 transition-colors duration-200"
                  onClick={() => setIsAddColumnOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" /> Add Column
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Card Confirmation Dialog */}
      <AlertDialog open={isDeleteCardOpen} onOpenChange={setIsDeleteCardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this card? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 border rounded-md bg-muted/50 mt-2 mb-4">
            <p className="font-medium">{currentCard?.title}</p>
            {currentCard?.description && (
              <p className="text-sm text-muted-foreground mt-1">{currentCard.description}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteCardOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Card Dialog */}
      <Dialog 
        open={isEditCardOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // When closing, reset form state and force cleanup
            setIsTitleError(false);
            setIsEditCardOpen(false);
            
            // Add small delay then force cleanup any stuck overlays
            setTimeout(() => {
              forceCleanupDialogOverlays();
            }, 100);
          } else {
            setIsEditCardOpen(open);
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[425px]"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setIsEditCardOpen(false);
            forceCleanupDialogOverlays();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditCard} className="space-y-5 mt-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-card-title" className="text-base">Card Title</Label>
                <Input
                  id="edit-card-title"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Card title"
                  required
                  className={`border-input ${isTitleError ? 'border-red-500 animate-shake' : ''}`}
                />
                {isTitleError && (
                  <p className="text-sm text-red-500">Card title is required</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-card-description" className="text-base">Description</Label>
                <Textarea
                  id="edit-card-description"
                  value={newCardDescription}
                  onChange={(e) => setNewCardDescription(e.target.value)}
                  placeholder="Card description"
                  rows={3}
                  className="border-input resize-none"
                />
              </div>
            </div>
            
            <div className="border-t border-b py-4 my-2">
              <h4 className="text-sm font-medium mb-3">Card Properties</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-card-due-date" className="text-sm">Due Date</Label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="edit-card-due-date"
                      type="date"
                      value={newCardDueDate}
                      onChange={(e) => setNewCardDueDate(e.target.value)}
                      className="border-input pl-10 h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-card-tags" className="text-sm">Tags</Label>
              <div className="flex items-center mt-1 mb-2 space-x-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-card-tags"
                  value={newCardTags}
                  onChange={(e) => setNewCardTags(e.target.value)}
                  placeholder="frontend, bug, documentation (comma separated)"
                  className="border-input h-9"
                />
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditCardOpen(false)} 
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog 
        open={isAddCardOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // When closing, reset form state and force cleanup
            setAddCardColumnId('');
            setNewCardTitle('');
            setNewCardDescription('');
            setNewCardTags('');
            setNewCardDueDate('');
            setIsTitleError(false);
            setIsAddCardOpen(false);
            
            // Add small delay then force cleanup any stuck overlays
            setTimeout(() => {
              forceCleanupDialogOverlays();
            }, 100);
          } else {
            setIsAddCardOpen(open);
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[425px]"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setIsAddCardOpen(false);
            forceCleanupDialogOverlays();
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
          </DialogHeader>
          
          {/* Card Creation Steps Indicator */}
          <div className="flex items-center justify-between mb-6 mt-2">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-primary text-white w-6 h-6 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className="h-[2px] w-12 bg-muted"></div>
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-muted text-muted-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="text-sm text-muted-foreground">Metadata</span>
            </div>
          </div>
          
          <form onSubmit={handleAddCard} className="space-y-5">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="card-title" className="text-base">Card Title</Label>
                <Input
                  id="card-title"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  required
                  className={`border-input ${isTitleError ? 'border-red-500 animate-shake' : ''}`}
                />
                {isTitleError && (
                  <p className="text-sm text-red-500">Card title is required</p>
                )}
                <p className="text-sm text-muted-foreground">Be clear and concise</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="card-description" className="text-base">Description</Label>
                <Textarea
                  id="card-description"
                  value={newCardDescription}
                  onChange={(e) => setNewCardDescription(e.target.value)}
                  placeholder="Add more details about this task..."
                  rows={3}
                  className="border-input resize-none"
                />
                <p className="text-sm text-muted-foreground">Provide context and requirements</p>
              </div>
            </div>
            
            <div className="border-t border-b py-4 my-2">
              <h4 className="text-sm font-medium mb-3">Card Properties</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="card-due-date" className="text-sm">Due Date</Label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="card-due-date"
                      type="date"
                      value={newCardDueDate}
                      onChange={(e) => setNewCardDueDate(e.target.value)}
                      className="border-input pl-10 h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="card-tags" className="text-sm">Tags</Label>
              <div className="flex items-center mt-1 mb-2 space-x-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="card-tags"
                  value={newCardTags}
                  onChange={(e) => setNewCardTags(e.target.value)}
                  placeholder="frontend, bug, documentation (comma separated)"
                  className="border-input h-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">Add tags to categorize and filter cards</p>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddCardOpen(false)} 
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
        .kanban-container {
          scroll-padding: 16px;
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;
