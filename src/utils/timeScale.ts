export type TimeScale = "days" | "weeks" | "months";

export const detectTimeScale = (startDate: Date, endDate: Date): TimeScale => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 60) {
        // 2 months
        return "days";
    } else if (diffDays <= 365) {
        // 1 year
        return "weeks";
    } else {
        return "months";
    }
};

export const getOptimalTimelineMarkers = (
    startDate: Date,
    endDate: Date,
    timeScale: TimeScale
) => {
    const markers = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
        markers.push({
            date: new Date(current),
            label: formatMarkerLabel(current, timeScale),
            labelLine1: formatMarkerLabelLine1(current, timeScale),
            labelLine2: formatMarkerLabelLine2(current, timeScale),
        });

        if (timeScale === "days") {
            current.setDate(current.getDate() + 7); // Weekly markers for day scale
        } else if (timeScale === "weeks") {
            current.setDate(current.getDate() + 14); // Bi-weekly markers for week scale
        } else {
            current.setMonth(current.getMonth() + 1); // Monthly markers for month scale
        }
    }

    return markers;
};

const formatMarkerLabel = (date: Date, timeScale: TimeScale): string => {
    if (timeScale === "days") {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    } else if (timeScale === "weeks") {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    } else {
        return date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        });
    }
};

const formatMarkerLabelLine1 = (date: Date, timeScale: TimeScale): string => {
    if (timeScale === "days") {
        return date.toLocaleDateString("en-US", {
            month: "short",
        });
    } else if (timeScale === "weeks") {
        return date.toLocaleDateString("en-US", {
            month: "short",
        });
    } else {
        return date.toLocaleDateString("en-US", {
            month: "short",
        });
    }
};

const formatMarkerLabelLine2 = (date: Date, timeScale: TimeScale): string => {
    if (timeScale === "days") {
        return date.toLocaleDateString("en-US", {
            day: "numeric",
        });
    } else if (timeScale === "weeks") {
        return date.toLocaleDateString("en-US", {
            day: "numeric",
        });
    } else {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
        });
    }
};
