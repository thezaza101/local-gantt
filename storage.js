/* Storage Layer */

class Storage {
    static exportPlanFile(state) {
        const json = JSON.stringify(state, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "planning-file.json";
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static exportSinglePlanFile(state, planIndex) {
        if (!state || !state.plans || planIndex < 0 || planIndex >= state.plans.length) return;

        const singlePlanState = {
            meta: { ...state.meta },
            settings: state.settings,
            plans: [state.plans[planIndex]]
        };

        if (window.APP_VERSION) {
            singlePlanState.meta.appVersion = window.APP_VERSION;
        }

        const json = JSON.stringify(singlePlanState, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const planName = state.plans[planIndex].name || "plan";
        const safePlanName = planName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        const a = document.createElement("a");
        a.href = url;
        a.download = `${safePlanName}-export.json`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static importPlanFile(file, callback) {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const result = JSON.parse(event.target.result);
                if (Storage.validateFile(result)) {
                    callback(null, result);
                } else {
                    callback(new Error("Invalid file structure. Missing meta or plans array."));
                }
            } catch (error) {
                callback(error);
            }
        };

        reader.onerror = (error) => {
            callback(error);
        };

        reader.readAsText(file);
    }

    static async fetchLatestPlan() {
        try {
            const response = await fetch('latest.json');
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            if (Storage.validateFile(data)) {
                return data;
            } else {
                console.error("latest.json failed validation.");
                return null;
            }
        } catch (error) {
            console.error("Error fetching latest.json:", error);
            return null;
        }
    }

    static validateFile(data) {
        // Basic validation as per Phase 1 requirements
        if (data && typeof data === 'object') {
            if (data.meta && data.meta.fileVersion !== undefined && Array.isArray(data.plans)) {
                return true;
            }
        }
        return false;
    }
}