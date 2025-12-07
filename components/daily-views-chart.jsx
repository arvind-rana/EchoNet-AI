"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

const DailyViewsChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-slate-400">No view data available</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.day),
    datasets: [
      {
        data: data.map((item) => item.views),
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#8b5cf6",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#e2e8f0",
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(71, 85, 105, 0.3)" },
        ticks: { color: "#94a3b8" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(71, 85, 105, 0.3)" },
        ticks: { color: "#94a3b8" },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default DailyViewsChart;



// What is a Server Component? (default)

// In Next.js 13+, every component is a server component by default.

// Server components:

// Run on Node.js, not browser

// No access to window, document, or browser APIs

// Can use async/await directly

// Can fetch data securely

// Do NOT increase bundle size, because they don’t ship to the browser

// Server components are perfect for:

// ✔ Fetching data
// ✔ Rendering static UI
// ✔ SEO pages
// ✔ Expensive calculations
// ✔ Interacting with database (Prisma, Convex, MongoDB)

// ❌ Server components cannot:

// Use useState, useEffect, useRef

// Use event listeners like onClick

// Use browser-only libraries like Chart.js, Mapbox, Stripe JS

// 🔥 2. What is a Client Component?

// Client components run in the browser, so they can use:

// ✔ useState
// ✔ useEffect
// ✔ DOM APIs
// ✔ window, document
// ✔ animations
// ✔ charts
// ✔ maps
// ✔ event listeners like onClick, onChange
