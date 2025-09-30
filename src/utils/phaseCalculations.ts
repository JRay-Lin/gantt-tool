import type { Task } from '../types';

export const calculatePhaseDate = (phaseId: string, tasks: Task[], type: 'start' | 'end'): Date | null => {
  const childTasks = tasks.filter(t => t.parentId === phaseId && t.type === 'task');
  
  if (childTasks.length === 0) return null;
  
  const dates = childTasks
    .map(task => type === 'start' ? task.startDate : task.endDate)
    .filter((date): date is Date => date !== undefined);
  
  if (dates.length === 0) return null;
  
  return type === 'start' 
    ? new Date(Math.min(...dates.map(d => d.getTime())))
    : new Date(Math.max(...dates.map(d => d.getTime())));
};

export const getTaskWithCalculatedDates = (task: Task, tasks: Task[]): Task => {
  if (task.type === 'phase') {
    const startDate = calculatePhaseDate(task.id, tasks, 'start');
    const endDate = calculatePhaseDate(task.id, tasks, 'end');
    
    return {
      ...task,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    };
  }
  
  return task;
};

export const getAllTasksWithCalculatedDates = (tasks: Task[]): Task[] => {
  return tasks.map(task => getTaskWithCalculatedDates(task, tasks));
};

export const calculateProjectTimeline = (tasks: Task[]): { start: Date; end: Date } | null => {
  const tasksWithDates = getAllTasksWithCalculatedDates(tasks);
  const allDates = tasksWithDates
    .filter(task => task.startDate && task.endDate)
    .flatMap(task => [task.startDate!, task.endDate!]);
  
  if (allDates.length === 0) {
    const now = new Date();
    return {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)   // 1 month from now
    };
  }
  
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Add 2% padding on each side
  const totalDuration = maxDate.getTime() - minDate.getTime();
  const padding = totalDuration * 0.02;

  return {
    start: new Date(minDate.getTime() - padding),
    end: new Date(maxDate.getTime() + padding)
  };
};

export const validateTaskStructure = (tasks: Task[]): string[] => {
  const errors: string[] = [];
  
  tasks.forEach(task => {
    if (task.type === 'phase') {
      const children = tasks.filter(t => t.parentId === task.id);
      if (children.length === 0) {
        errors.push(`Phase "${task.name}" must have at least one child task`);
      }
    } else if (task.type === 'task') {
      if (!task.startDate || !task.endDate) {
        errors.push(`Task "${task.name}" must have start and end dates`);
      }
      if (task.startDate && task.endDate && task.startDate > task.endDate) {
        errors.push(`Task "${task.name}" start date must be before end date`);
      }
    }
  });
  
  return errors;
};