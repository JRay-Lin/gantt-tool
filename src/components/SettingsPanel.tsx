import type { FC } from "react";
import type { Task, ProjectSettings } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    CardTitle,
    CardAction,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SettingsPanelProps {
    tasks: Task[];
    settings: ProjectSettings;
    onAddTask: (parentId?: string, taskType?: "phase" | "task") => void;
    onAddPhase: () => void;
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
    onUpdateSettings: (updates: Partial<ProjectSettings>) => void;
    onReorderTasks?: (tasks: Task[]) => void;
}

interface SortablePhaseCardProps {
    phase: Task;
    tasks: Task[];
    onAddTask: (parentId?: string, taskType?: "phase" | "task") => void;
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
    onReorderTasks?: (tasks: Task[]) => void;
    getTasksForPhase: (phaseId: string) => Task[];
}

const SortablePhaseCard: FC<SortablePhaseCardProps> = ({
    phase,
    tasks,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onReorderTasks,
    getTasksForPhase,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: phase.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const phaseTasks = getTasksForPhase(phase.id);

    return (
        <Card ref={setNodeRef} style={style} className="phase-card">
            <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                    >
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <Input
                        type="text"
                        value={phase.name}
                        onChange={(e) =>
                            onUpdateTask(phase.id, {
                                name: e.target.value,
                            })
                        }
                        className="font-semibold text-lg border-none p-2 h-auto focus-visible:ring-0"
                        placeholder="Phase name"
                    />
                </CardTitle>
                <CardAction className="flex items-center">
                    <div className="relative">
                        <input
                            type="color"
                            value={phase.color}
                            onChange={(e) =>
                                onUpdateTask(phase.id, {
                                    color: e.target.value,
                                })
                            }
                            className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 p-0 pointer-events-none"
                        >
                            <div
                                className="w-4 h-4 rounded-full border"
                                style={{
                                    backgroundColor: phase.color,
                                }}
                            />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDeleteTask(phase.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </CardAction>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
                <DndContext
                    sensors={useSensors(
                        useSensor(PointerSensor),
                        useSensor(KeyboardSensor, {
                            coordinateGetter: sortableKeyboardCoordinates,
                        })
                    )}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id || !onReorderTasks) return;

                        const oldIndex = phaseTasks.findIndex((t) => t.id === active.id);
                        const newIndex = phaseTasks.findIndex((t) => t.id === over.id);

                        if (oldIndex === -1 || newIndex === -1) return;

                        // Get all other tasks (not in this phase)
                        const otherTasks = tasks.filter(
                            (t) => !(t.parentId === phase.id && t.type === "task")
                        );

                        // Reorder tasks within this phase
                        const reorderedPhaseTasks = arrayMove(phaseTasks, oldIndex, newIndex);

                        // Reconstruct full task list
                        const newTasks: Task[] = [];
                        otherTasks.forEach((task) => {
                            newTasks.push(task);
                            if (task.id === phase.id) {
                                // Insert reordered phase tasks right after the phase
                                newTasks.push(...reorderedPhaseTasks);
                            }
                        });

                        onReorderTasks(newTasks);
                    }}
                >
                    <SortableContext
                        items={phaseTasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {phaseTasks.map((task) => (
                            <SortableTaskCard
                                key={task.id}
                                task={task}
                                onUpdateTask={onUpdateTask}
                                onDeleteTask={onDeleteTask}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </CardContent>

            <CardFooter className="pt-3">
                <Button
                    onClick={() => onAddTask(phase.id, "task")}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </Button>
            </CardFooter>
        </Card>
    );
};

interface SortableTaskCardProps {
    task: Task;
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
}

const SortableTaskCard: FC<SortableTaskCardProps> = ({
    task,
    onUpdateTask,
    onDeleteTask,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="task-component p-3 border rounded-lg bg-muted/30"
        >
            <div className="task-row space-y-3">
                <div className="task-name-row flex items-center gap-2">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded flex-shrink-0"
                    >
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Input
                        type="text"
                        value={task.name}
                        onChange={(e) =>
                            onUpdateTask(task.id, {
                                name: e.target.value,
                            })
                        }
                        className="flex-1"
                        placeholder="Task name"
                    />
                    <div className="task-actions-small flex items-center gap-1">
                        <div className="relative">
                            <input
                                type="color"
                                value={task.color}
                                onChange={(e) =>
                                    onUpdateTask(task.id, {
                                        color: e.target.value,
                                    })
                                }
                                className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 p-0 pointer-events-none"
                            >
                                <div
                                    className="w-3 h-3 rounded-full border"
                                    style={{
                                        backgroundColor: task.color,
                                    }}
                                />
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDeleteTask(task.id)}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
                <div className="task-details-row space-y-2">
                    <div className="task-date-row">
                        <Label className="text-xs text-muted-foreground">
                            Start
                        </Label>
                        <DatePicker
                            value={task.startDate}
                            onChange={(date: Date | undefined) =>
                                onUpdateTask(task.id, {
                                    startDate: date,
                                })
                            }
                            placeholder="Start date"
                        />
                    </div>
                    <div className="task-date-row">
                        <Label className="text-xs text-muted-foreground">
                            End
                        </Label>
                        <DatePicker
                            value={task.endDate}
                            onChange={(date: Date | undefined) =>
                                onUpdateTask(task.id, {
                                    endDate: date,
                                })
                            }
                            placeholder="End date"
                            minDate={task.startDate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SettingsPanel: FC<SettingsPanelProps> = ({
    tasks,
    onAddTask,
    onAddPhase,
    onUpdateTask,
    onDeleteTask,
    onReorderTasks,
}) => {
    const getPhases = () => {
        return tasks.filter((t) => t.type === "phase" && !t.parentId);
    };

    const getTasksForPhase = (phaseId: string) => {
        return tasks.filter((t) => t.parentId === phaseId && t.type === "task");
    };

    const getRootTasks = () => {
        return tasks.filter((t) => t.type === "task" && !t.parentId);
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id || !onReorderTasks) {
            return;
        }

        const phases = getPhases();
        const oldIndex = phases.findIndex((p) => p.id === active.id);
        const newIndex = phases.findIndex((p) => p.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const reorderedPhases = arrayMove(phases, oldIndex, newIndex);

        // Reconstruct tasks array with reordered phases
        const newTasks: Task[] = [];

        reorderedPhases.forEach((phase) => {
            newTasks.push(phase);
            const phaseTasks = getTasksForPhase(phase.id);
            newTasks.push(...phaseTasks);
        });

        // Add root tasks at the end
        newTasks.push(...getRootTasks());

        onReorderTasks(newTasks);
    };

    return (
        <div className="h-full flex flex-col p-6 bg-background">
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Phases & Tasks</h3>
                    <div className="add-buttons flex gap-2">
                        <Button
                            onClick={onAddPhase}
                            variant="default"
                            className="gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Phase
                        </Button>
                        <Button
                            onClick={() => onAddTask()}
                            variant="outline"
                            className="gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Task
                        </Button>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 h-[200px] rounded-md">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={getPhases().map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {/* Phase Cards */}
                            {getPhases().map((phase) => (
                                <SortablePhaseCard
                                    key={phase.id}
                                    phase={phase}
                                    tasks={tasks}
                                    onAddTask={onAddTask}
                                    onUpdateTask={onUpdateTask}
                                    onDeleteTask={onDeleteTask}
                                    onReorderTasks={onReorderTasks}
                                    getTasksForPhase={getTasksForPhase}
                                />
                            ))}

                    {/* Root Tasks (tasks without phases) */}
                    {getRootTasks().length > 0 && (
                        <Card className="root-tasks-section">
                            <CardHeader>
                                <CardTitle>Individual Tasks</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {getRootTasks().map((task) => (
                                    <div
                                        key={task.id}
                                        className="root-task-card p-3 border rounded-lg bg-muted/30"
                                    >
                                        <div className="task-row space-y-3">
                                            <div className="task-name-row flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    value={task.name}
                                                    onChange={(e) =>
                                                        onUpdateTask(task.id, {
                                                            name: e.target
                                                                .value,
                                                        })
                                                    }
                                                    className="flex-1"
                                                    placeholder="Task name"
                                                />
                                                <div className="task-actions-small flex items-center gap-1">
                                                    <div className="relative">
                                                        <input
                                                            type="color"
                                                            value={task.color}
                                                            onChange={(e) =>
                                                                onUpdateTask(task.id, {
                                                                    color: e.target.value,
                                                                })
                                                            }
                                                            className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-7 h-7 p-0 pointer-events-none"
                                                        >
                                                        <div
                                                            className="w-3 h-3 rounded-full border"
                                                            style={{
                                                                backgroundColor:
                                                                    task.color,
                                                            }}
                                                        />
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-7 h-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            onDeleteTask(
                                                                task.id
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="task-details-row space-y-2">
                                                <div className="task-date-row">
                                                    <Label className="text-xs text-muted-foreground">
                                                        Start
                                                    </Label>
                                                    <DatePicker
                                                        value={task.startDate}
                                                        onChange={(
                                                            date:
                                                                | Date
                                                                | undefined
                                                        ) =>
                                                            onUpdateTask(
                                                                task.id,
                                                                {
                                                                    startDate:
                                                                        date,
                                                                }
                                                            )
                                                        }
                                                        placeholder="Start date"
                                                    />
                                                </div>
                                                <div className="task-date-row">
                                                    <Label className="text-xs text-muted-foreground">
                                                        End
                                                    </Label>
                                                    <DatePicker
                                                        value={task.endDate}
                                                        onChange={(
                                                            date:
                                                                | Date
                                                                | undefined
                                                        ) =>
                                                            onUpdateTask(
                                                                task.id,
                                                                {
                                                                    endDate:
                                                                        date,
                                                                }
                                                            )
                                                        }
                                                        placeholder="End date"
                                                        minDate={task.startDate}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                            {tasks.length === 0 && (
                                <Card className="empty-state">
                                    <CardContent className="text-center py-12">
                                        <p className="text-muted-foreground">
                                            No tasks yet. Click "Add Phase" or "Add
                                            Task" to get started.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </ScrollArea>
        </div>
    );
};
