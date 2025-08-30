export interface Task {
  id: string;
  name: string;
  type: 'phase' | 'task';
  startDate?: Date;
  endDate?: Date;
  color: string;
  parentId?: string;
  level: number;
  isExpanded?: boolean;
  dependencies?: string[];
}

export interface ProjectSettings {
  workingDays: number[];
  showDatesInBars?: boolean;
}

export interface GanttProject {
  tasks: Task[];
  settings: ProjectSettings;
}