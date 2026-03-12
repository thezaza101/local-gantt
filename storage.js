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