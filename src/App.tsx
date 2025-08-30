import { useState } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { GanttChart } from "./components/GanttChart";
import type { Task, ProjectSettings } from "./types";
import {
    calculateProjectTimeline,
    getAllTasksWithCalculatedDates,
} from "./utils/phaseCalculations";
import "./App.css";
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
        const parentLevel = parentId
            ? tasks.find((t) => t.id === parentId)?.level ?? -1
            : -1;
        const newTask: Task = {
            id: Date.now().toString(),
            name: taskType === "phase" ? "New Phase" : "New Task",
            type: taskType,
            startDate: taskType === "task" ? new Date() : undefined,
            endDate:
                taskType === "task"
                    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    : undefined,
            color: taskType === "phase" ? "#9b59b6" : "#d1c4e9",
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
        <div className="app">
            <div className="app-container">
                <div className="settings-column">
                    <SettingsPanel
                        tasks={tasks}
                        settings={settings}
                        onAddTask={handleAddTask}
                        onAddPhase={handleAddPhase}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                        onUpdateSettings={handleUpdateSettings}
                    />
                </div>
                <div className="chart-column">
                    <GanttChart
                        tasks={tasksWithCalculatedDates}
                        settings={settingsWithTimeline}
                        onToggleExpand={handleToggleExpand}
                        onUpdateSettings={handleUpdateSettings}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
