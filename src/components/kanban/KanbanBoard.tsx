
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanItem {
  id: string;
  title: string;
  description: string;
  column: string;
  tags?: string[];
}

interface KanbanBoardProps {
  onAddCard: () => void;
}

const KanbanBoard = ({ onAddCard }: KanbanBoardProps) => {
  const [items, setItems] = useState<KanbanItem[]>([
    {
      id: '1',
      title: 'Set up project repository',
      description: 'Initialize Git and create basic structure',
      column: 'backlog',
      tags: ['setup', 'dev-ops']
    },
    {
      id: '2',
      title: 'Create database schema',
      description: 'Design initial database tables and relationships',
      column: 'backlog',
      tags: ['database', 'planning']
    },
    {
      id: '3',
      title: 'Implement authentication',
      description: 'Add user login and registration functionality',
      column: 'in-progress',
      tags: ['auth', 'frontend']
    },
    {
      id: '4',
      title: 'Write API documentation',
      description: 'Document all endpoints and parameters',
      column: 'review',
      tags: ['docs']
    },
    {
      id: '5',
      title: 'Fix login bug',
      description: 'Address issue with session timeout',
      column: 'done',
      tags: ['bug', 'critical']
    }
  ]);

  const columns = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' }
  ];

  const moveItem = (itemId: string, targetColumn: string) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, column: targetColumn } 
        : item
    ));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    moveItem(itemId, columnId);
  };

  return (
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
              {items.filter(item => item.column === column.id).length}
            </span>
          </div>
          
          <div className="flex-grow overflow-auto bg-secondary/50 rounded-b-md p-2 space-y-2">
            {items
              .filter(item => item.column === column.id)
              .map(item => (
                <Card 
                  key={item.id}
                  className="cursor-move card-hover border-l-4 border-l-primary bg-card shadow-sm" 
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                >
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map(tag => (
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
              ))}
              
            {items.filter(item => item.column === column.id).length === 0 && (
              <div className="flex items-center justify-center h-20 border border-dashed rounded-md border-muted text-muted-foreground text-sm">
                No items
              </div>
            )}
            
            {column.id === 'backlog' && (
              <Button 
                onClick={onAddCard}
                variant="ghost" 
                className="w-full mt-2 border border-dashed text-muted-foreground"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Card
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
