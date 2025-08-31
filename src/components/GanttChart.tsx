import type { FC } from "react";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import domtoimage from "dom-to-image";
import type { Task, ProjectSettings } from "../types";
import {
    detectTimeScale,
    getOptimalTimelineMarkers,
    type TimeScale,
} from "../utils/timeScale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar, FileImage, ChevronDown, ChevronRight } from "lucide-react";

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

        // Store original styles
        const originalStyles = new Map<HTMLElement, string>();

        // Temporarily modify styles for export
        const elementsToModify = chartElement.querySelectorAll(
            ".task-name, .phase-name, span, label, .text-muted-foreground, .task-dates, .phase-color-band"
        );
        elementsToModify.forEach((element) => {
            const htmlElement = element as HTMLElement;

            if (element.classList.contains("phase-color-band")) {
                // Store original styles and make color bands completely opaque
                const originalOpacity = htmlElement.style.opacity;
                const originalBg = htmlElement.style.backgroundColor;
                originalStyles.set(htmlElement, originalOpacity + "|" + originalBg);
                
                // Force opacity to 1 with !important to override Framer Motion
                htmlElement.style.setProperty('opacity', '1', 'important');
                htmlElement.style.zIndex = "50";
                
                // Ensure background color is fully opaque (remove any alpha channel)
                const bgColor = window.getComputedStyle(htmlElement).backgroundColor;
                if (bgColor) {
                    const solidColor = bgColor.replace(/rgba?\(([^)]+)\)/, (match, values) => {
                        const parts = values.split(',').map((v: string) => v.trim());
                        return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
                    });
                    htmlElement.style.setProperty('background-color', solidColor, 'important');
                }
            } else {
                // Store original color and modify text colors
                originalStyles.set(htmlElement, htmlElement.style.color);

                if (element.classList.contains("task-dates")) {
                    htmlElement.style.color = "#ffffff";
                } else if (
                    element.classList.contains("text-muted-foreground")
                ) {
                    htmlElement.style.color = "#636363";
                } else {
                    htmlElement.style.color = "#1f1f1f";
                }
            }
        });

        // Set container background
        const originalBg = chartElement.style.backgroundColor;
        chartElement.style.backgroundColor = "#f8f8f8";

        try {
            const dataUrl = await domtoimage.toPng(chartElement, {
                quality: 1,
                bgcolor: "#f8f8f8",
                width: chartElement.offsetWidth * 2,
                height: chartElement.offsetHeight * 2,
                style: {
                    transform: "scale(2)",
                    transformOrigin: "top left",
                },
            });

            const link = document.createElement("a");
            link.download = `gantt-chart-${
                new Date().toISOString().split("T")[0]
            }.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            // Restore original styles
            originalStyles.forEach((originalValue, element) => {
                if (element.classList.contains("phase-color-band")) {
                    const [opacity, bgColor] = originalValue.split("|");
                    element.style.opacity = opacity;
                    if (bgColor) element.style.backgroundColor = bgColor;
                } else {
                    element.style.color = originalValue;
                }
            });
            chartElement.style.backgroundColor = originalBg;
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

    // Calculate responsive font size based on marker spacing
    const getResponsiveTextSize = () => {
        if (timelineMarkers.length < 2) return "text-xs";
        
        const avgSpacing = 100 / (timelineMarkers.length - 1); // Average percentage between markers
        if (avgSpacing < 8) return "text-[10px]"; // Very tight spacing
        if (avgSpacing < 15) return "text-xs"; // Tight spacing
        if (avgSpacing < 25) return "text-sm"; // Normal spacing
        return "text-base"; // Wide spacing
    };

    const responsiveTextClass = getResponsiveTextSize();

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
        <div className="h-fit flex flex-col">
            <div className="p-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Gantt Chart Preview</h3>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={settings.showDatesInBars ?? true}
                            onChange={(e) =>
                                onUpdateSettings?.({
                                    showDatesInBars: e.target.checked,
                                })
                            }
                            className="h-4 w-4"
                        />
                        <Label className="text-sm">Show dates in bars</Label>
                    </label>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={cycleTimeScale}
                        className="gap-2"
                    >
                        <Calendar className="h-4 w-4" />
                        {timeScale.charAt(0).toUpperCase() + timeScale.slice(1)}
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportToPNG}
                            className="gap-2"
                        >
                            <FileImage className="h-4 w-4" />
                            Export as PNG
                        </Button>
                    </div>
                </div>
            </div>
            <Card className="h-fit">
                <CardContent className="p-6 overflow-hidden">
                    <div className="gantt-container">
                        <div className="labels-column">
                            <div className="labels-header">
                                <Label className="font-semibold">Tasks</Label>
                            </div>

                            <div
                                className="labels-content"
                                ref={labelsContentRef}
                            >
                                {/* Phase color bands for expanded phases */}
                                <AnimatePresence>
                                    {visibleTasks
                                        .filter(
                                            (task) =>
                                                task.type === "phase" &&
                                                task.isExpanded
                                        )
                                        .map((phase) => {
                                            const childTasks =
                                                visibleTasks.filter(
                                                    (t) =>
                                                        t.parentId === phase.id
                                                );
                                            const bandHeight =
                                                childTasks.reduce(
                                                    (total, task) =>
                                                        total +
                                                        getTaskHeight(
                                                            task.level,
                                                            task
                                                        ),
                                                    0
                                                ) - 4; // Slightly smaller to prevent overlap

                                            // Calculate position based on filtered tasks (without expanded phases)
                                            const filteredTasks =
                                                visibleTasks.filter(
                                                    (task) =>
                                                        !(
                                                            task.type ===
                                                                "phase" &&
                                                            task.isExpanded
                                                        )
                                                );
                                            const firstChildIndex =
                                                filteredTasks.findIndex(
                                                    (t) =>
                                                        t.parentId === phase.id
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
                                                    initial={{
                                                        opacity: 0,
                                                        width: 0,
                                                    }}
                                                    animate={{
                                                        opacity: 0.6,
                                                        width: 12,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        width: 0,
                                                    }}
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
                                                        backgroundColor:
                                                            phase.color,
                                                        zIndex: 25,
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
                                                layout="position"
                                                initial={{
                                                    opacity: 0,
                                                    x: -15,
                                                    scale: 0.95,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    x: -15,
                                                    scale: 0.95,
                                                }}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: [0.4, 0.0, 0.2, 1],
                                                    layout: {
                                                        duration: 0.25,
                                                        ease: [
                                                            0.4, 0.0, 0.2, 1,
                                                        ],
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
                                                            position +=
                                                                getTaskHeight(
                                                                    filteredTasks[
                                                                        i
                                                                    ].level,
                                                                    filteredTasks[
                                                                        i
                                                                    ]
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
                                                            task.level === 0
                                                                ? 15
                                                                : 15
                                                        }px`,
                                                    }}
                                                >
                                                    {hasChildren(task.id) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                onToggleExpand(
                                                                    task.id
                                                                )
                                                            }
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            {task.isExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </Button>
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
                                        className="absolute top-0 h-full flex flex-col justify-center z-0"
                                        style={{ left: `${marker.position}%` }}
                                    >
                                        <div className="w-px h-full bg-gray-600" />
                                        <div className={`absolute top-2 left-1 ${responsiveTextClass} font-medium text-muted-foreground whitespace-nowrap z-10`}>
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
                                        duration: 0.25,
                                        ease: [0.4, 0.0, 0.2, 1],
                                    }}
                                    className="tasks-timeline-container"
                                    ref={tasksContainerRef}
                                    style={{
                                        height: `${
                                            visibleTasks.reduce(
                                                (total, task) =>
                                                    total +
                                                    getTaskHeight(
                                                        task.level,
                                                        task
                                                    ),
                                                0
                                            ) + 20
                                        }px`,
                                    }}
                                >
                                    {visibleBars.length === 0 ? (
                                        <div className="flex items-center justify-center h-32">
                                            <p className="text-muted-foreground text-center">
                                                No tasks to display. Add some
                                                tasks in the settings panel to
                                                see your Gantt chart.
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

                                                    const left =
                                                        calculatePosition(
                                                            task.startDate
                                                        );
                                                    const width =
                                                        calculateWidth(
                                                            task.startDate,
                                                            task.endDate
                                                        );

                                                    return (
                                                        <motion.div
                                                            key={task.id}
                                                            layout="position"
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
                                                                duration: 0.2,
                                                                ease: [
                                                                    0.4, 0.0,
                                                                    0.2, 1,
                                                                ],
                                                                layout: {
                                                                    duration: 0.25,
                                                                    ease: [
                                                                        0.4,
                                                                        0.0,
                                                                        0.2, 1,
                                                                    ],
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
                                                                        barIndex *
                                                                        0.03,
                                                                    ease: [
                                                                        0.68,
                                                                        -0.55,
                                                                        0.265,
                                                                        1.55,
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
                                                                    borderRadius:
                                                                        "4px",
                                                                    border:
                                                                        task.type ===
                                                                        "phase"
                                                                            ? "2px solid rgba(0,0,0,0.2)"
                                                                            : "none",
                                                                    zIndex:
                                                                        task.level ===
                                                                        0
                                                                            ? 10
                                                                            : 20,
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

                            <div className="grid-lines absolute inset-0 pointer-events-none z-0">
                                {timelineMarkers.map((marker, index) => (
                                    <div
                                        key={index}
                                        className="absolute top-0 h-full w-px bg-gray-600"
                                        style={{ left: `${marker.position}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
