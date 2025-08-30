import type { FC } from "react";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Task, ProjectSettings } from "../types";
import {
    detectTimeScale,
    getOptimalTimelineMarkers,
    type TimeScale,
} from "../utils/timeScale";

interface GanttChartProps {
    tasks: Task[];
    settings: ProjectSettings;
    onToggleExpand: (id: string) => void;
    onUpdateSettings?: (updates: Partial<ProjectSettings>) => void;
}

export const GanttChart: FC<GanttChartProps> = ({
    tasks,
    settings,
    onToggleExpand,
    onUpdateSettings,
}) => {
    const [manualTimeScale, setManualTimeScale] = useState<TimeScale | null>(
        null
    );

    // Calculate timeline dates from tasks if not provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timelineStart = (settings as any).timelineStart || new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timelineEnd = (settings as any).timelineEnd || new Date();

    const autoDetectedTimeScale = detectTimeScale(timelineStart, timelineEnd);
    const timeScale = manualTimeScale || autoDetectedTimeScale;

    const timeScales: TimeScale[] = ["days", "weeks", "months"];

    const cycleTimeScale = () => {
        const currentIndex = timeScales.indexOf(timeScale);
        const nextIndex = (currentIndex + 1) % timeScales.length;
        setManualTimeScale(timeScales[nextIndex]);
    };

    const exportToPNG = async () => {
        const chartElement = document.querySelector(
            ".gantt-container"
        ) as HTMLElement;
        if (!chartElement) return;

        try {
            const canvas = await html2canvas(chartElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            const link = document.createElement("a");
            link.download = `gantt-chart-${
                new Date().toISOString().split("T")[0]
            }.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    const exportToPDF = async () => {
        const chartElement = document.querySelector(
            ".gantt-container"
        ) as HTMLElement;
        if (!chartElement) return;

        try {
            const canvas = await html2canvas(chartElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            const pdf = new jsPDF({
                orientation:
                    canvas.width > canvas.height ? "landscape" : "portrait",
                unit: "mm",
                format: "a4",
            });

            const imgWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(
                canvas.toDataURL("image/png"),
                "PNG",
                0,
                0,
                imgWidth,
                imgHeight
            );
            pdf.save(
                `gantt-chart-${new Date().toISOString().split("T")[0]}.pdf`
            );
        } catch (error) {
            console.error("Export failed:", error);
        }
    };
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const labelsContentRef = useRef<HTMLDivElement>(null);
    const tasksContainerRef = useRef<HTMLDivElement>(null);

    // Synchronize scroll between labels and timeline
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        const labelsContent = labelsContentRef.current;

        if (!scrollContainer || !labelsContent) return;

        const handleScroll = (e: Event) => {
            const scrollTop = (e.target as HTMLElement).scrollTop;
            if (labelsContent && labelsContent.scrollTop !== scrollTop) {
                labelsContent.scrollTop = scrollTop;
            }
        };

        scrollContainer.addEventListener("scroll", handleScroll);
        return () =>
            scrollContainer.removeEventListener("scroll", handleScroll);
    }, []);

    const calculatePosition = (date: Date) => {
        const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
        const dateOffset = date.getTime() - timelineStart.getTime();
        return Math.max(0, Math.min(100, (dateOffset / totalDuration) * 100));
    };

    const calculateWidth = (startDate: Date, endDate: Date) => {
        const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
        const taskDuration = endDate.getTime() - startDate.getTime();
        return Math.max(1, (taskDuration / totalDuration) * 100);
    };

    const getVisibleTasks = () => {
        const visible: Task[] = [];
        const addTaskAndChildren = (task: Task) => {
            visible.push(task);
            if (task.isExpanded) {
                const children = tasks.filter((t) => t.parentId === task.id);
                children.forEach((child) => addTaskAndChildren(child));
            }
        };

        const rootTasks = tasks.filter((t) => !t.parentId);
        rootTasks.forEach((task) => addTaskAndChildren(task));

        return visible;
    };

    const shouldShowBar = (task: Task) => {
        // Show bars for regular tasks
        if (task.type === "task") return true;

        // For phases: only show bar if collapsed (not expanded)
        if (task.type === "phase") {
            return !task.isExpanded;
        }

        return true;
    };

    const getVisibleTasksForBars = () => {
        return getVisibleTasks().filter(shouldShowBar);
    };

    const timelineMarkers = getOptimalTimelineMarkers(
        timelineStart,
        timelineEnd,
        timeScale
    ).map((marker) => ({
        ...marker,
        position: calculatePosition(marker.date),
    }));

    const visibleTasks = getVisibleTasks();
    const visibleBars = getVisibleTasksForBars();

    const hasChildren = (taskId: string) => {
        return tasks.some((t) => t.parentId === taskId);
    };

    const getTaskHeight = (level: number, task?: Task) => {
        if (level === 0) {
            // For phases: smaller height when expanded (acts like section header)
            if (task?.type === "phase" && task?.isExpanded) {
                return 35; // Expanded phase height (same as subtask)
            }
            return 50; // Collapsed phase height
        }
        if (level === 1) return 40; // First level task
        return 35; // Second+ level tasks
    };

    const calculateBarPosition = (barIndex: number) => {
        // Calculate position based on filtered tasks (matching the labels)
        const filteredTasks = visibleTasks.filter(
            (task) => !(task.type === "phase" && task.isExpanded)
        );
        let position = 0;
        for (let i = 0; i < barIndex; i++) {
            position += getTaskHeight(filteredTasks[i].level, filteredTasks[i]);
        }
        return position;
    };

    return (
        <div className="gantt-chart">
            <div className="chart-header">
                <h2>Gantt Chart Preview</h2>
                <div className="chart-info">
                    <label className="chart-control">
                        <input
                            type="checkbox"
                            checked={settings.showDatesInBars ?? true}
                            onChange={(e) =>
                                onUpdateSettings?.({
                                    showDatesInBars: e.target.checked,
                                })
                            }
                        />
                        <span className="chart-control-label">
                            Show dates in bars
                        </span>
                    </label>

                    <span
                        className="time-scale-info clickable"
                        onClick={cycleTimeScale}
                        title="Click to change time scale"
                    >
                        Time Scale: {timeScale} {manualTimeScale && ""}
                    </span>

                    <div className="export-controls">
                        <button
                            className="export-button"
                            onClick={exportToPNG}
                            title="Export as PNG"
                        >
                            📷 PNG
                        </button>
                        <button
                            className="export-button"
                            onClick={exportToPDF}
                            title="Export as PDF"
                        >
                            📄 PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="gantt-container">
                <div className="labels-column">
                    <div className="labels-header">
                        <span>Tasks</span>
                    </div>

                    <div className="labels-content" ref={labelsContentRef}>
                        {/* Phase color bands for expanded phases */}
                        <AnimatePresence>
                            {visibleTasks
                                .filter(
                                    (task) =>
                                        task.type === "phase" && task.isExpanded
                                )
                                .map((phase) => {
                                    const childTasks = visibleTasks.filter(
                                        (t) => t.parentId === phase.id
                                    );
                                    const bandHeight =
                                        childTasks.reduce(
                                            (total, task) =>
                                                total +
                                                getTaskHeight(task.level, task),
                                            0
                                        ) - 4; // Slightly smaller to prevent overlap

                                    // Calculate position based on filtered tasks (without expanded phases)
                                    const filteredTasks = visibleTasks.filter(
                                        (task) =>
                                            !(
                                                task.type === "phase" &&
                                                task.isExpanded
                                            )
                                    );
                                    const firstChildIndex =
                                        filteredTasks.findIndex(
                                            (t) => t.parentId === phase.id
                                        );
                                    let bandTop = 0;
                                    if (firstChildIndex >= 0) {
                                        for (
                                            let i = 0;
                                            i < firstChildIndex;
                                            i++
                                        ) {
                                            bandTop += getTaskHeight(
                                                filteredTasks[i].level,
                                                filteredTasks[i]
                                            );
                                        }
                                    }

                                    return (
                                        <motion.div
                                            key={`band-${phase.id}`}
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{
                                                opacity: 0.6,
                                                width: 12,
                                            }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{
                                                duration: 0.4,
                                                ease: "easeInOut",
                                            }}
                                            whileHover={{
                                                opacity: 0.8,
                                                width: 16,
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            className="phase-color-band clickable-band"
                                            onClick={() =>
                                                onToggleExpand(phase.id)
                                            }
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: `${bandTop}px`,
                                                height: `${bandHeight}px`,
                                                backgroundColor: phase.color,
                                                zIndex: 5,
                                                cursor: "pointer",
                                            }}
                                            title={`Click to collapse ${phase.name}`}
                                        />
                                    );
                                })}
                        </AnimatePresence>

                        <AnimatePresence mode="popLayout">
                            {visibleTasks
                                .filter(
                                    (task) =>
                                        !(
                                            task.type === "phase" &&
                                            task.isExpanded
                                        )
                                )
                                .map((task, index) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{
                                            opacity: 0,
                                            x: -15,
                                            scale: 0.95,
                                        }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{
                                            opacity: 0,
                                            x: -15,
                                            scale: 0.95,
                                        }}
                                        transition={{
                                            duration: 0.25,
                                            ease: [0.25, 0.46, 0.45, 0.94],
                                            layout: {
                                                duration: 0.3,
                                                ease: "easeInOut",
                                            },
                                        }}
                                        className={`task-label-row level-${
                                            task.level
                                        } ${task.type}-label-row${
                                            task.type === "phase" &&
                                            task.isExpanded
                                                ? " expanded"
                                                : ""
                                        }`}
                                        style={{
                                            top: `${(() => {
                                                // Calculate position based on filtered tasks
                                                const filteredTasks =
                                                    visibleTasks.filter(
                                                        (task) =>
                                                            !(
                                                                task.type ===
                                                                    "phase" &&
                                                                task.isExpanded
                                                            )
                                                    );
                                                let position = 0;
                                                for (
                                                    let i = 0;
                                                    i < index;
                                                    i++
                                                ) {
                                                    position += getTaskHeight(
                                                        filteredTasks[i].level,
                                                        filteredTasks[i]
                                                    );
                                                }
                                                return position;
                                            })()}px`,
                                            height: `${getTaskHeight(
                                                task.level,
                                                task
                                            )}px`,
                                            ...(task.type === "phase" &&
                                            !task.isExpanded
                                                ? {
                                                      backgroundColor: `${task.color}20`, // 20% opacity
                                                      borderLeft: `3px solid ${task.color}`,
                                                  }
                                                : {}),
                                        }}
                                    >
                                        <div
                                            className="task-label-content"
                                            style={{
                                                paddingLeft: `${
                                                    task.level === 0 ? 15 : 15
                                                }px`,
                                            }}
                                        >
                                            {hasChildren(task.id) && (
                                                <button
                                                    onClick={() =>
                                                        onToggleExpand(task.id)
                                                    }
                                                    className="expand-button-preview"
                                                >
                                                    {task.isExpanded
                                                        ? "▼"
                                                        : "▶"}
                                                </button>
                                            )}
                                            <span
                                                className={`task-name ${task.type}-name`}
                                            >
                                                {task.name}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="timeline-container">
                    <div className="timeline-header">
                        {timelineMarkers.map((marker, index) => (
                            <div
                                key={index}
                                className="timeline-marker"
                                style={{ left: `${marker.position}%` }}
                            >
                                <div className="marker-line" />
                                <div className="marker-label">
                                    {marker.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div
                        className="gantt-scroll-wrapper"
                        ref={scrollContainerRef}
                    >
                        <motion.div
                            layout
                            transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                            }}
                            className="tasks-timeline-container"
                            ref={tasksContainerRef}
                            style={{
                                height: `${
                                    visibleTasks.reduce(
                                        (total, task) =>
                                            total +
                                            getTaskHeight(task.level, task),
                                        0
                                    ) + 20
                                }px`,
                            }}
                        >
                            {visibleBars.length === 0 ? (
                                <div className="empty-chart">
                                    <p>
                                        No tasks to display. Add some tasks in
                                        the settings panel to see your Gantt
                                        chart.
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {visibleBars
                                        .map((task, barIndex) => {
                                            if (
                                                !task.startDate ||
                                                !task.endDate
                                            )
                                                return null;

                                            const left = calculatePosition(
                                                task.startDate
                                            );
                                            const width = calculateWidth(
                                                task.startDate,
                                                task.endDate
                                            );

                                            return (
                                                <motion.div
                                                    key={task.id}
                                                    layout
                                                    initial={{
                                                        opacity: 0,
                                                        y: -10,
                                                        scale: 0.9,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                        scale: 1,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        y: -10,
                                                        scale: 0.9,
                                                    }}
                                                    transition={{
                                                        duration: 0.25,
                                                        ease: [
                                                            0.25, 0.46, 0.45,
                                                            0.94,
                                                        ],
                                                        layout: {
                                                            duration: 0.3,
                                                            ease: "easeInOut",
                                                        },
                                                    }}
                                                    className={`task-bar-row level-${task.level} ${task.type}-bar-row`}
                                                    style={{
                                                        top: `${calculateBarPosition(
                                                            barIndex
                                                        )}px`,
                                                        height: `${getTaskHeight(
                                                            task.level,
                                                            task
                                                        )}px`,
                                                    }}
                                                >
                                                    <motion.div
                                                        initial={{
                                                            scale: 0.7,
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            scale: 1,
                                                            opacity: 1,
                                                        }}
                                                        exit={{
                                                            scale: 0.7,
                                                            opacity: 0,
                                                        }}
                                                        transition={{
                                                            duration: 0.2,
                                                            delay:
                                                                barIndex * 0.03,
                                                            ease: [
                                                                0.68, -0.55,
                                                                0.265, 1.55,
                                                            ],
                                                        }}
                                                        className={`task-bar ${task.type}-bar`}
                                                        style={{
                                                            left: `${left}%`,
                                                            width: `${width}%`,
                                                            backgroundColor:
                                                                task.color,
                                                            height:
                                                                task.type ===
                                                                "phase"
                                                                    ? "32px"
                                                                    : "24px",
                                                            borderRadius: "4px",
                                                            border:
                                                                task.type ===
                                                                "phase"
                                                                    ? "2px solid rgba(0,0,0,0.2)"
                                                                    : "none",
                                                        }}
                                                    >
                                                        {(settings.showDatesInBars ??
                                                            true) && (
                                                            <div
                                                                className={`task-dates ${task.type}-dates`}
                                                            >
                                                                {task.startDate.toLocaleDateString()}{" "}
                                                                -{" "}
                                                                {task.endDate.toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                    {task.level > 0 && (
                                                        <div
                                                            className="task-connector"
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                left: `${
                                                                    (task.level -
                                                                        1) *
                                                                        20 +
                                                                    10
                                                                }px`,
                                                                top: "20px",
                                                                width: `${
                                                                    task.level *
                                                                        20 -
                                                                    10
                                                                }px`,
                                                                height: "1px",
                                                                backgroundColor:
                                                                    "#ccc",
                                                                borderTop:
                                                                    "1px dashed #999",
                                                            }}
                                                        />
                                                    )}
                                                </motion.div>
                                            );
                                        })
                                        .filter(Boolean)}
                                </AnimatePresence>
                            )}
                        </motion.div>
                    </div>

                    <div className="grid-lines">
                        {timelineMarkers.map((marker, index) => (
                            <div
                                key={index}
                                className="grid-line"
                                style={{ left: `${marker.position}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
