
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Minus, ListChecks, Target, Timer } from 'lucide-react';

// Define the task type as a union of literal strings
type TaskType = 'task' | 'habit' | 'recurring';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: any) => void;
}

const TaskForm = ({ open, onOpenChange, onSubmit }: TaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('task');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Advanced tracking options
  const [trackingType, setTrackingType] = useState<'none' | 'numeric' | 'timer' | 'checklist'>('none');
  
  // Numeric goal options
  const [numericTarget, setNumericTarget] = useState('1');
  const [numericUnit, setNumericUnit] = useState('');
  
  // Timer goal options
  const [timerDuration, setTimerDuration] = useState('15');
  
  // Checklist options
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: '', done: false }
  ]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const task = {
      id: Date.now().toString(),
      title,
      description,
      type,
      category,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      completed: false
    };
    
    // Add tracking features based on the selected type
    if (trackingType === 'numeric') {
      Object.assign(task, {
        numericGoal: {
          current: 0,
          target: Number(numericTarget),
          unit: numericUnit
        }
      });
    } else if (trackingType === 'timer') {
      Object.assign(task, {
        timerGoal: {
          duration: Number(timerDuration),
          elapsed: 0
        }
      });
    } else if (trackingType === 'checklist') {
      // Filter out empty items
      const validItems = checklistItems.filter(item => item.text.trim() !== '');
      if (validItems.length > 0) {
        Object.assign(task, {
          checklist: {
            items: validItems
          }
        });
      }
    }
    
    // Initialize streak for habits
    if (type === 'habit') {
      Object.assign(task, {
        streak: 0,
        bestStreak: 0
      });
    }

    onSubmit(task);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('task');
    setCategory('');
    setDueDate('');
    setTrackingType('none');
    setNumericTarget('1');
    setNumericUnit('');
    setTimerDuration('15');
    setChecklistItems([{ id: '1', text: '', done: false }]);
  };

  const categories = ['Work', 'Personal', 'Coding', 'Health', 'Finance', 'Education'];
  
  const addChecklistItem = () => {
    setChecklistItems([
      ...checklistItems,
      { id: Date.now().toString(), text: '', done: false }
    ]);
  };
  
  const removeChecklistItem = (id: string) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter(item => item.id !== id));
    }
  };
  
  const updateChecklistItem = (id: string, text: string) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, text } : item
      )
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: TaskType) => setType(value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="habit">Habit</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input 
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          
          {/* Advanced tracking options */}
          {(type === 'habit' || type === 'task') && (
            <div className="grid gap-2 mt-4">
              <Label>Tracking Options</Label>
              <Tabs 
                value={trackingType} 
                onValueChange={(v) => setTrackingType(v as 'none' | 'numeric' | 'timer' | 'checklist')}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="none">None</TabsTrigger>
                  <TabsTrigger value="numeric" className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    <span>Goal</span>
                  </TabsTrigger>
                  <TabsTrigger value="timer" className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    <span>Timer</span>
                  </TabsTrigger>
                  <TabsTrigger value="checklist" className="flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    <span>List</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="numeric" className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <Label htmlFor="numericTarget">Target</Label>
                      <Input
                        id="numericTarget"
                        type="number"
                        value={numericTarget}
                        onChange={(e) => setNumericTarget(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="numericUnit">Unit (optional)</Label>
                      <Input
                        id="numericUnit"
                        value={numericUnit}
                        onChange={(e) => setNumericUnit(e.target.value)}
                        placeholder="e.g., glasses, pages, miles"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="timer" className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="timerDuration">Duration (minutes)</Label>
                    <Input
                      id="timerDuration"
                      type="number"
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="checklist" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    {checklistItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Input
                          value={item.text}
                          onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                          placeholder={`Item ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChecklistItem(item.id)}
                          disabled={checklistItems.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addChecklistItem}
                      className="w-full mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
