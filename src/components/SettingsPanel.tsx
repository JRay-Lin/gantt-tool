import type { FC } from "react";
import type { Task, ProjectSettings } from "../types";

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
    const formatDateForInput = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    const parseDate = (dateStr: string) => {
        return new Date(dateStr);
    };

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
        <div className="settings-panel">
            <div className="settings-section">
                <div className="section-header">
                    <h2>Phases & Tasks</h2>
                    <div className="add-buttons">
                        <button
                            onClick={onAddPhase}
                            className="add-button phase-button"
                        >
                            + Add Phase
                        </button>
                        <button
                            onClick={() => onAddTask()}
                            className="add-button task-button"
                        >
                            + Add Task
                        </button>
                    </div>
                </div>

                <div className="cards-container">
                    {/* Phase Cards */}
                    {getPhases().map((phase) => (
                        <div key={phase.id} className="phase-card">
                            <div className="phase-header">
                                <input
                                    type="text"
                                    value={phase.name}
                                    onChange={(e) =>
                                        onUpdateTask(phase.id, {
                                            name: e.target.value,
                                        })
                                    }
                                    className="phase-name-input"
                                    placeholder="Phase name"
                                />
                                <div className="phase-actions">
                                    <div
                                        className="color-circle"
                                        style={{ backgroundColor: phase.color }}
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
                                    />
                                    <button
                                        onClick={() => onDeleteTask(phase.id)}
                                        className="delete-button"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="tasks-container">
                                {getTasksForPhase(phase.id).map((task) => (
                                    <div
                                        key={task.id}
                                        className="task-component"
                                    >
                                        <div className="task-row">
                                            <div className="task-name-row">
                                                <input
                                                    type="text"
                                                    value={task.name}
                                                    onChange={(e) =>
                                                        onUpdateTask(task.id, {
                                                            name: e.target
                                                                .value,
                                                        })
                                                    }
                                                    className="task-name-input-small"
                                                    placeholder="Task name"
                                                />
                                                <div className="task-actions-small">
                                                    <div
                                                        className="color-circle color-circle-small"
                                                        style={{
                                                            backgroundColor:
                                                                task.color,
                                                        }}
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
                                                    />
                                                    <button
                                                        onClick={() =>
                                                            onDeleteTask(
                                                                task.id
                                                            )
                                                        }
                                                        className="delete-button delete-button-small"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="task-details-row">
                                                <div className="task-dates-inline">
                                                    <input
                                                        type="date"
                                                        value={
                                                            task.startDate
                                                                ? formatDateForInput(
                                                                      task.startDate
                                                                  )
                                                                : ""
                                                        }
                                                        onChange={(e) =>
                                                            onUpdateTask(
                                                                task.id,
                                                                {
                                                                    startDate:
                                                                        parseDate(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ),
                                                                }
                                                            )
                                                        }
                                                        className="date-input-small"
                                                        placeholder="Start date"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={
                                                            task.endDate
                                                                ? formatDateForInput(
                                                                      task.endDate
                                                                  )
                                                                : ""
                                                        }
                                                        onChange={(e) =>
                                                            onUpdateTask(
                                                                task.id,
                                                                {
                                                                    endDate:
                                                                        parseDate(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ),
                                                                }
                                                            )
                                                        }
                                                        className="date-input-small"
                                                        placeholder="End date"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="phase-footer">
                                <button
                                    onClick={() => onAddTask(phase.id, "task")}
                                    className="add-task-footer-button"
                                >
                                    + Add Task
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Root Tasks (tasks without phases) */}
                    {getRootTasks().length > 0 && (
                        <div className="root-tasks-section">
                            <h3>Individual Tasks</h3>
                            {getRootTasks().map((task) => (
                                <div key={task.id} className="root-task-card">
                                    <div className="task-row">
                                        <div className="task-name-row">
                                            <input
                                                type="text"
                                                value={task.name}
                                                onChange={(e) =>
                                                    onUpdateTask(task.id, {
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="task-name-input-small"
                                                placeholder="Task name"
                                            />
                                            <div className="task-actions-small">
                                                <div
                                                    className="color-circle color-circle-small"
                                                    style={{
                                                        backgroundColor:
                                                            task.color,
                                                    }}
                                                    onClick={() => {
                                                        const colorInput =
                                                            document.createElement(
                                                                "input"
                                                            );
                                                        colorInput.type =
                                                            "color";
                                                        colorInput.value =
                                                            task.color;
                                                        colorInput.onchange = (
                                                            e
                                                        ) =>
                                                            onUpdateTask(
                                                                task.id,
                                                                {
                                                                    color: (
                                                                        e.target as HTMLInputElement
                                                                    ).value,
                                                                }
                                                            );
                                                        colorInput.click();
                                                    }}
                                                />
                                                <button
                                                    onClick={() =>
                                                        onDeleteTask(task.id)
                                                    }
                                                    className="delete-button delete-button-small"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                        <div className="task-details-row">
                                            <div className="task-dates-inline">
                                                <input
                                                    type="date"
                                                    value={
                                                        task.startDate
                                                            ? formatDateForInput(
                                                                  task.startDate
                                                              )
                                                            : ""
                                                    }
                                                    onChange={(e) =>
                                                        onUpdateTask(task.id, {
                                                            startDate:
                                                                parseDate(
                                                                    e.target
                                                                        .value
                                                                ),
                                                        })
                                                    }
                                                    className="date-input-small"
                                                    placeholder="Start date"
                                                />
                                                <input
                                                    type="date"
                                                    value={
                                                        task.endDate
                                                            ? formatDateForInput(
                                                                  task.endDate
                                                              )
                                                            : ""
                                                    }
                                                    onChange={(e) =>
                                                        onUpdateTask(task.id, {
                                                            endDate: parseDate(
                                                                e.target.value
                                                            ),
                                                        })
                                                    }
                                                    className="date-input-small"
                                                    placeholder="End date"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tasks.length === 0 && (
                        <div className="empty-state">
                            No tasks yet. Click "Add Phase" or "Add Task" to get
                            started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
