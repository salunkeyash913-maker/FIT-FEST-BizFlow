/**
 * BizFlow AI - Chart.js Productivity Summary & Reactive Charts Engine
 */

let categoryChartInstance = null;
let velocityChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  // Delay slightly to ensure Chart.js global library script is loaded
  setTimeout(initProductivityCharts, 200);
});

function initProductivityCharts() {
  if (typeof Chart === 'undefined') return;

  // Chart default dark font settings
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';

  renderCategoryChart();
  renderVelocityChart();
}

function updateProductivityCharts() {
  if (typeof Chart === 'undefined') return;
  renderCategoryChart();
  renderVelocityChart();
}

function renderCategoryChart() {
  const canvas = document.getElementById('chart-category');
  if (!canvas) return;

  const tasks = store.tasks;
  const categories = ['Finance', 'Operations', 'Marketing', 'Support', 'Sales', 'General'];
  const counts = categories.map(cat => tasks.filter(t => t.category === cat).length);

  const data = {
    labels: categories,
    datasets: [{
      data: counts,
      backgroundColor: [
        'rgba(16, 185, 129, 0.75)',  // Finance - Emerald
        'rgba(56, 189, 248, 0.75)',  // Operations - Sky
        'rgba(168, 85, 247, 0.75)',  // Marketing - Purple
        'rgba(245, 158, 11, 0.75)',  // Support - Amber
        'rgba(236, 72, 153, 0.75)',  // Sales - Pink
        'rgba(148, 163, 184, 0.5)'   // General - Slate
      ],
      borderColor: '#0f1623',
      borderWidth: 2,
      hoverOffset: 6
    }]
  };

  if (categoryChartInstance) {
    categoryChartInstance.data = data;
    categoryChartInstance.update();
  } else {
    categoryChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 14,
              font: { size: 11, weight: '500' },
              color: '#cbd5e1'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            displayColors: true
          }
        }
      }
    });
  }
}

function renderVelocityChart() {
  const canvas = document.getElementById('chart-velocity');
  if (!canvas) return;

  const metrics = store.getMetrics();
  
  // Simulated weekly velocity data based on active metrics
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const completedData = [1, 3, 2, 4, metrics.done + 1, metrics.done, metrics.done + 2];
  const createdData = [2, 4, 3, 5, metrics.total, metrics.total + 1, metrics.total];

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Completed Tasks',
        data: completedData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointRadius: 4
      },
      {
        label: 'Total Active Backlog',
        data: createdData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4
      }
    ]
  };

  if (velocityChartInstance) {
    velocityChartInstance.data = data;
    velocityChartInstance.update();
  } else {
    velocityChartInstance = new Chart(canvas, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              usePointStyle: true,
              font: { size: 11 },
              color: '#cbd5e1'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#64748b', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#64748b', font: { size: 11 }, stepSize: 1 },
            beginAtZero: true
          }
        }
      }
    });
  }
}

window.updateProductivityCharts = updateProductivityCharts;
