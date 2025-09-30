import { useState } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { GanttChart } from "./components/GanttChart";
import type { Task, ProjectSettings } from "./types";
import {
    calculateProjectTimeline,
    getAllTasksWithCalculatedDates,
} from "./utils/phaseCalculations";
import { getTaskColorFromParent } from "./utils/colorUtils";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
    const [tasks, setTasks] = useState<Task[]>([
        {
            id: "1",
            name: "Project Planning",
            type: "phase",
            color: "#3498db",
            level: 0,
            isExpanded: true,
        },
        {
            id: "1-1",
            name: "Requirements Gathering",
            type: "task",
            startDate: new Date("2024-01-01"),
            endDate: new Date("2024-01-07"),
            color: "#5dade2",
            parentId: "1",
            level: 1,
        },
        {
            id: "1-2",
            name: "Technical Design",
            type: "task",
            startDate: new Date("2024-01-08"),
            endDate: new Date("2024-01-15"),
            color: "#5dade2",
            parentId: "1",
            level: 1,
        },
        {
            id: "2",
            name: "Development Phase",
            type: "phase",
            color: "#e74c3c",
            level: 0,
            isExpanded: true,
        },
        {
            id: "2-1",
            name: "Frontend Development",
            type: "task",
            startDate: new Date("2024-01-16"),
            endDate: new Date("2024-02-05"),
            color: "#f1948a",
            parentId: "2",
            level: 1,
        },
        {
            id: "2-2",
            name: "Backend API",
            type: "task",
            startDate: new Date("2024-01-20"),
            endDate: new Date("2024-02-15"),
            color: "#f1948a",
            parentId: "2",
            level: 1,
        },
        {
            id: "3",
            name: "Testing & QA Phase",
            type: "phase",
            color: "#f39c12",
            level: 0,
            isExpanded: false,
        },
        {
            id: "3-1",
            name: "Unit Testing",
            type: "task",
            startDate: new Date("2024-02-10"),
            endDate: new Date("2024-02-20"),
            color: "#f7dc6f",
            parentId: "3",
            level: 1,
        },
        {
            id: "3-2",
            name: "Integration Testing",
            type: "task",
            startDate: new Date("2024-02-21"),
            endDate: new Date("2024-02-28"),
            color: "#f7dc6f",
            parentId: "3",
            level: 1,
        },
    ]);

    const [settings, setSettings] = useState<ProjectSettings>({
        workingDays: [1, 2, 3, 4, 5],
    });

    const handleAddTask = (
        parentId?: string,
        taskType: "phase" | "task" = "task"
    ) => {
        const parentTask = parentId
            ? tasks.find((t) => t.id === parentId)
            : undefined;
        const parentLevel = parentTask?.level ?? -1;

        // Find the latest end date among relevant tasks
        const getSmartStartDate = () => {
            let relevantTasks = tasks.filter((task) => task.endDate);
            
            // If adding task to a phase, only consider tasks within that phase
            if (parentTask && parentTask.type === "phase") {
                const phaseChildren = relevantTasks.filter((task) => task.parentId === parentId);
                if (phaseChildren.length > 0) {
                    relevantTasks = phaseChildren;
                }
            }
            
            if (relevantTasks.length === 0) {
                return new Date(); // Default to today if no relevant tasks exist
            }

            const latestEndDate = new Date(
                Math.max(...relevantTasks.map((task) => task.endDate!.getTime()))
            );

            // Set start date to the same as the latest end date
            const smartStartDate = new Date(latestEndDate);

            return smartStartDate;
        };

        const smartStartDate =
            taskType === "task" ? getSmartStartDate() : undefined;
        const smartEndDate =
            taskType === "task" && smartStartDate
                ? new Date(smartStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                : undefined;

        // Determine color based on parent phase
        const getTaskColor = () => {
            if (taskType === "phase") {
                return "#9b59b6"; // Default phase color
            }
            
            if (parentTask && parentTask.type === "phase") {
                return getTaskColorFromParent(parentTask.color);
            }
            
            return "#d1c4e9"; // Default task color fallback
        };

        const newTask: Task = {
            id: Date.now().toString(),
            name: taskType === "phase" ? "New Phase" : "New Task",
            type: taskType,
            startDate: smartStartDate,
            endDate: smartEndDate,
            color: getTaskColor(),
            parentId,
            level: parentLevel + 1,
            isExpanded: true,
        };
        setTasks([...tasks, newTask]);
    };

    const handleAddPhase = () => {
        handleAddTask(undefined, "phase");
    };

    const handleUpdateTask = (id: string, updates: Partial<Task>) => {
        setTasks(
            tasks.map((task) =>
                task.id === id ? { ...task, ...updates } : task
            )
        );
    };

    const handleDeleteTask = (id: string) => {
        const deleteWithChildren = (taskId: string): string[] => {
            const childIds = tasks
                .filter((t) => t.parentId === taskId)
                .map((t) => t.id);
            const allIds = [taskId];
            childIds.forEach((childId) => {
                allIds.push(...deleteWithChildren(childId));
            });
            return allIds;
        };

        const idsToDelete = deleteWithChildren(id);
        setTasks(tasks.filter((task) => !idsToDelete.includes(task.id)));
    };

    const handleToggleExpand = (id: string) => {
        setTasks(
            tasks.map((task) =>
                task.id === id
                    ? { ...task, isExpanded: !task.isExpanded }
                    : task
            )
        );
    };

    const handleReorderTasks = (reorderedTasks: Task[]) => {
        setTasks(reorderedTasks);
    };

    const handleUpdateSettings = (updates: Partial<ProjectSettings>) => {
        setSettings({ ...settings, ...updates });
    };

    // Computed values with automatic timeline and phase calculations
    const tasksWithCalculatedDates = getAllTasksWithCalculatedDates(tasks);
    const projectTimeline = calculateProjectTimeline(tasks);
    const settingsWithTimeline = {
        ...settings,
        timelineStart: projectTimeline?.start || new Date(),
        timelineEnd: projectTimeline?.end || new Date(),
    };

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-background">
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] h-screen">
                    <div className="settings-column border-r border-border bg-muted/10 overflow-hidden">
                        <SettingsPanel
                            tasks={tasks}
                            settings={settings}
                            onAddTask={handleAddTask}
                            onAddPhase={handleAddPhase}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onUpdateSettings={handleUpdateSettings}
                            onReorderTasks={handleReorderTasks}
                        />
                    </div>
                    <div className="chart-column overflow-hidden p-6">
                        <GanttChart
                            tasks={tasksWithCalculatedDates}
                            settings={settingsWithTimeline}
                            onToggleExpand={handleToggleExpand}
                            onUpdateSettings={handleUpdateSettings}
                            onReorderTasks={handleReorderTasks}
                        />
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
}

export default App;
