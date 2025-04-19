document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard script loaded');
    
    // Initialize all charts
    initSalesChart();
    initCategoryChart();
    initRevenueByDeviceChart();
    
    // Set up date range filters
    setupDateFilters();
    
    // Initialize responsive behaviors
    setupResponsiveLayout();
});

/**
 * Initialize the main sales overview chart
 */
function initSalesChart() {
    const salesChartElement = document.getElementById('salesChart');
    if (!salesChartElement) return;
    
    const ctx = salesChartElement.getContext('2d');
    
    // Get theme colors from CSS variables
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3b82f6';
    const primaryLightColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-100').trim() || 'rgba(59, 130, 246, 0.2)';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e5e7eb';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e5e7eb';
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    
    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, primaryLightColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Get data from the backend
    // We're expecting the server to provide sales_data as a dictionary with day keys and sales values
    const salesDataElement = document.getElementById('salesData');
    let salesData;
    
    if (salesDataElement) {
        try {
            salesData = JSON.parse(salesDataElement.textContent);
        } catch (e) {
            console.error('Error parsing sales data', e);
            salesData = null;
        }
    }
    
    // If we couldn't get data from the server, use default data
    if (!salesData) {
        salesData = {
            'mon': 0, 
            'tue': 0, 
            'wed': 0, 
            'thu': 0, 
            'fri': 0, 
            'sat': 0, 
            'sun': 0
        };
    }
    
    // Convert to arrays for Chart.js
    const labels = Object.keys(salesData).map(day => day.charAt(0).toUpperCase() + day.slice(1));
    const values = Object.values(salesData);
    
    // Create chart
    const salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weekly Sales',
                data: values,
                backgroundColor: gradient,
                borderColor: primaryColor,
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: cardBg,
                pointBorderColor: primaryColor,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11
                        },
                        padding: 10,
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11
                        },
                        padding: 10
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    backgroundColor: cardBg,
                    titleColor: textColor,
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyColor: textColor,
                    bodyFont: {
                        size: 12
                    },
                    padding: 12,
                    borderColor: borderColor,
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.raw;
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            hover: {
                mode: 'nearest',
                intersect: true
            }
        }
    });
    
    // Update chart colors when theme changes
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === "data-theme") {
                updateChartColors(salesChart);
            }
        });
    });
    
    observer.observe(htmlElement, { attributes: true });
    
    // Set up time period filter buttons
    const timeFilterButtons = document.querySelectorAll('.btn-group button');
    if (timeFilterButtons.length > 0) {
        timeFilterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                timeFilterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update chart data based on selected time period
                // This would typically fetch data from the server
                let newData;
                const period = this.textContent.trim().toLowerCase();
                
                if (period === 'week') {
                    newData = [12, 19, 13, 17, 20, 25, 32];
                    salesChart.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                } else if (period === 'month') {
                    newData = [42, 38, 35, 27, 43, 47, 38, 35, 42, 27, 35, 32, 43, 47, 41, 38, 42, 45, 35, 38, 32, 28, 35, 40, 38, 32, 28, 30, 32, 35];
                    salesChart.data.labels = Array.from({length: 30}, (_, i) => i + 1);
                } else {
                    newData = values;
                    salesChart.data.labels = labels;
                }
                
                salesChart.data.datasets[0].data = newData;
                salesChart.update();
            });
        });
    }
}

/**
 * Initialize the category breakdown chart (donut/pie chart)
 */
function initCategoryChart() {
    const categoryChartElement = document.getElementById('categoryChart');
    if (!categoryChartElement) return;
    
    const ctx = categoryChartElement.getContext('2d');
    
    // Get theme colors
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3b82f6';
    const secondary = getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#6366f1';
    const success = getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#10b981';
    const warning = getComputedStyle(document.documentElement).getPropertyValue('--warning').trim() || '#f59e0b';
    const danger = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#ef4444';
    const info = getComputedStyle(document.documentElement).getPropertyValue('--info').trim() || '#06b6d4';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    
    // Get data from the backend
    const categoryNames = window.categoryNames || [];
    const categorySales = window.categorySales || [];
    
    // If no data is available, use defaults
    let labels = categoryNames.length > 0 ? categoryNames : ['No Data Available'];
    let data = categorySales.length > 0 ? categorySales : [100];
    
    // Colors array for categories
    const colorArray = [primary, secondary, success, warning, danger, info];
    
    // Create chart
    const categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colorArray.slice(0, data.length),
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: textColor
                    }
                },
                tooltip: {
                    backgroundColor: cardBg,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim(),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: $${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Update chart colors when theme changes
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === "data-theme") {
                updateChartColors(categoryChart);
            }
        });
    });
    
    observer.observe(htmlElement, { attributes: true });
}

/**
 * Initialize the revenue by device chart
 */
function initRevenueByDeviceChart() {
    const chartElement = document.getElementById('revenueByDeviceChart');
    if (!chartElement) return;
    
    const ctx = chartElement.getContext('2d');
    
    // Get theme colors
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3b82f6';
    const secondary = getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#6366f1';
    const warning = getComputedStyle(document.documentElement).getPropertyValue('--warning').trim() || '#f59e0b';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    
    // Get device data from backend (fallback to defaults if not available)
    const deviceData = window.deviceData || { 'Desktop': 55, 'Mobile': 35, 'Tablet': 10 };
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(deviceData),
            datasets: [{
                data: Object.values(deviceData),
                backgroundColor: [primary, secondary, warning],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: textColor
                    }
                },
                tooltip: {
                    backgroundColor: cardBg,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim(),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${percentage}%`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update chart colors when theme changes
 */
function updateChartColors(chart) {
    // Get new theme colors
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const primaryLightColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-100').trim() || 'rgba(59, 130, 246, 0.2)';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    
    // Update chart colors
    chart.options.scales.y.grid.color = gridColor;
    chart.options.scales.y.ticks.color = textColor;
    chart.options.scales.x.ticks.color = textColor;
    
    // Update dataset colors
    chart.data.datasets[0].borderColor = primaryColor;
    
    // Create new gradient
    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, primaryLightColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    chart.data.datasets[0].backgroundColor = gradient;
    
    // Update chart
    chart.update();
}

/**
 * Set up date range filters for charts
 */
function setupDateFilters() {
    const dateRangeSelect = document.getElementById('dateRangeSelect');
    if (!dateRangeSelect) return;
    
    dateRangeSelect.addEventListener('change', function() {
        // In a real app, this would fetch data from the server based on the selected date range
        // For now, we'll just log the selected value
        console.log('Date range changed to', this.value);
    });
}

/**
 * Set up responsive behaviors for dashboard
 */
function setupResponsiveLayout() {
    // Add any responsive behaviors here
    
    // Handle window resize events
    window.addEventListener('resize', handleScreenChange);
    
    // Initial check
    handleScreenChange();
    
    function handleScreenChange() {
        const width = window.innerWidth;
        
        // Adjust card layouts on smaller screens
        if (width < 768) {
            // Mobile layout adjustments if needed
        } else {
            // Desktop layout adjustments if needed
        }
    }
} 