/* Graph Engine */

class GraphEngine {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.chartInstance = null;
    }

    render(plan) {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) return;

        // If no plan is selected or no timeline is defined
        if (!plan || !plan.timeline) {
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }
            return;
        }

        // Calculate data
        const capacityData = window.CapacityEngine.calculateExpandedCapacity(plan);
        const demandData = window.CapacityEngine.calculateDemand(plan);

        // Merge period keys to form the X-axis labels
        const periodSet = new Set();
        capacityData.forEach(item => periodSet.add(item.period));
        demandData.forEach(item => periodSet.add(item.period));

        // If no data to show, clear the chart
        if (periodSet.size === 0) {
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }
            return;
        }

        // Sort periods
        const labels = Array.from(periodSet).sort((a, b) => a.localeCompare(b));

        // Map data values to labels
        const capacityValues = labels.map(label => {
            const entry = capacityData.find(d => d.period === label);
            return entry ? entry.capacity : 0;
        });

        const demandValues = labels.map(label => {
            const entry = demandData.find(d => d.period === label);
            return entry ? entry.demand : 0;
        });

        // Define plugin globally so it can be registered/referenced properly
        const overcapacityPlugin = {
            id: 'overcapacityHighlight',
            beforeDraw: (chart) => {
                const { ctx, chartArea: { top, bottom, left, right }, scales: { x } } = chart;

                chart.data.labels.forEach((label, index) => {
                    // Extract datasets directly from chart for current values
                    const capacityDataset = chart.data.datasets.find(ds => ds.label === 'Capacity');
                    const demandDataset = chart.data.datasets.find(ds => ds.label === 'Demand');

                    if (!capacityDataset || !demandDataset) return;

                    const capacity = capacityDataset.data[index] || 0;
                    const demand = demandDataset.data[index] || 0;

                    if (demand > capacity) {
                        ctx.save();
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';

                        let width = x.width / x.ticks.length;
                        let xPos = x.getPixelForValue(index);

                        let rectStartX = Math.max(left, xPos - width / 2);
                        let rectEndX = Math.min(right, xPos + width / 2);

                        if (rectStartX < rectEndX) {
                            ctx.fillRect(rectStartX, top, rectEndX - rectStartX, bottom - top);
                        }
                        ctx.restore();
                    }
                });
            }
        };


        const config = {
            type: 'bar', // Base type
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'line',
                        label: 'Demand',
                        data: demandValues,
                        borderColor: '#ff4d4d',
                        backgroundColor: '#ff4d4d',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        type: 'bar',
                        label: 'Capacity',
                        data: capacityValues,
                        backgroundColor: '#4da3ff',
                        borderColor: '#1c6ed5',
                        borderWidth: 1,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Periods'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Effort Units'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Capacity vs Demand'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            },
            plugins: [overcapacityPlugin]
        };

        if (this.chartInstance) {
            // Update existing chart
            this.chartInstance.data = config.data;
            this.chartInstance.options = config.options;
            this.chartInstance.update();
        } else {
            // Create new chart
            const ctx = canvas.getContext('2d');
            this.chartInstance = new Chart(ctx, config);
        }
    }
}