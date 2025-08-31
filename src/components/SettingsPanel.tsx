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
import { Trash2, Plus } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface SettingsPanelProps {
    tasks: Task[];
    settings: ProjectSettings;
    onAddTask: (parentId?: string, taskType?: "phase" | "task") => void;
    onAddPhase: () => void;
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
    onUpdateSettings: (updates: Partial<ProjectSettings>) => void;
}

export const SettingsPanel: FC<SettingsPanelProps> = ({
    tasks,
    onAddTask,
    onAddPhase,
    onUpdateTask,
    onDeleteTask,
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
                <div className="space-y-4">
                    {/* Phase Cards */}
                    {getPhases().map((phase) => (
                        <Card key={phase.id} className="phase-card">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2">
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
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 p-0"
                                        onClick={() => {
                                            const colorInput =
                                                document.createElement("input");
                                            colorInput.type = "color";
                                            colorInput.value = phase.color;
                                            colorInput.onchange = (e) =>
                                                onUpdateTask(phase.id, {
                                                    color: (
                                                        e.target as HTMLInputElement
                                                    ).value,
                                                });
                                            colorInput.click();
                                        }}
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full border"
                                            style={{
                                                backgroundColor: phase.color,
                                            }}
                                        />
                                    </Button>
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
                                {getTasksForPhase(phase.id).map((task) => (
                                    <div
                                        key={task.id}
                                        className="task-component p-3 border rounded-lg bg-muted/30"
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-7 h-7 p-0"
                                                        onClick={() => {
                                                            const colorInput =
                                                                document.createElement(
                                                                    "input"
                                                                );
                                                            colorInput.type =
                                                                "color";
                                                            colorInput.value =
                                                                task.color;
                                                            colorInput.onchange =
                                                                (e) =>
                                                                    onUpdateTask(
                                                                        task.id,
                                                                        {
                                                                            color: (
                                                                                e.target as HTMLInputElement
                                                                            )
                                                                                .value,
                                                                        }
                                                                    );
                                                            colorInput.click();
                                                        }}
                                                    >
                                                        <div
                                                            className="w-3 h-3 rounded-full border"
                                                            style={{
                                                                backgroundColor:
                                                                    task.color,
                                                            }}
                                                        />
                                                    </Button>
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
                                            <div className="task-details-row">
                                                <div className="task-dates-inline flex gap-2">
                                                    <div className="flex-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Start
                                                        </Label>
                                                        <DatePicker
                                                            value={
                                                                task.startDate
                                                            }
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
                                                    <div className="flex-1">
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
                                    </div>
                                ))}
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-7 h-7 p-0"
                                                        onClick={() => {
                                                            const colorInput =
                                                                document.createElement(
                                                                    "input"
                                                                );
                                                            colorInput.type =
                                                                "color";
                                                            colorInput.value =
                                                                task.color;
                                                            colorInput.onchange =
                                                                (e) =>
                                                                    onUpdateTask(
                                                                        task.id,
                                                                        {
                                                                            color: (
                                                                                e.target as HTMLInputElement
                                                                            )
                                                                                .value,
                                                                        }
                                                                    );
                                                            colorInput.click();
                                                        }}
                                                    >
                                                        <div
                                                            className="w-3 h-3 rounded-full border"
                                                            style={{
                                                                backgroundColor:
                                                                    task.color,
                                                            }}
                                                        />
                                                    </Button>
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
                                            <div className="task-details-row">
                                                <div className="task-dates-inline flex gap-2">
                                                    <div className="flex-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Start
                                                        </Label>
                                                        <DatePicker
                                                            value={
                                                                task.startDate
                                                            }
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
                                                    <div className="flex-1">
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
            </ScrollArea>
        </div>
    );
};
