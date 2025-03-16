"use client";

import { useEffect, useRef } from "react";

// Mock data for the chart
const mockData = {
  dates: [
    "Mar 1", "Mar 2", "Mar 3", "Mar 4", "Mar 5", 
    "Mar 8", "Mar 9", "Mar 10", "Mar 11", "Mar 12", 
    "Mar 15", "Mar 16", "Mar 17", "Mar 18", "Mar 19", 
    "Mar 22", "Mar 23", "Mar 24", "Mar 25", "Mar 26",
    "Mar 29", "Mar 30", "Mar 31"
  ],
  values: [
    0, 120, 180, 250, 210, 
    330, 290, 410, 350, 580, 
    520, 620, 670, 720, 650, 
    800, 720, 830, 780, 940,
    850, 910, 1020
  ]
};

export function PerformanceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2); // For retina displays

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw chart
    drawChart(ctx, width, height);
  }, []);

  const drawChart = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate scales
    const maxValue = Math.max(...mockData.values);
    const xStep = chartWidth / (mockData.dates.length - 1);
    const yScale = chartHeight / maxValue;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = "#94a3b8"; // slate-400
    ctx.lineWidth = 1;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw y-axis labels
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#64748b"; // slate-500
    ctx.font = "12px system-ui";

    // Draw horizontal grid lines and labels
    const yLabelStep = Math.ceil(maxValue / 5);
    for (let i = 0; i <= 5; i++) {
      const yValue = i * yLabelStep;
      const yPos = height - padding - (yValue * yScale);
      
      // Grid line
      ctx.beginPath();
      ctx.strokeStyle = "#e2e8f0"; // slate-200
      ctx.moveTo(padding, yPos);
      ctx.lineTo(width - padding, yPos);
      ctx.stroke();
      
      // Label
      ctx.fillText(`$${yValue}`, padding - 10, yPos);
    }

    // Draw x-axis labels (show only every 4th label to avoid cluttering)
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < mockData.dates.length; i += 4) {
      const xPos = padding + i * xStep;
      ctx.fillText(mockData.dates[i], xPos, height - padding + 10);
    }

    // Draw line chart
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6"; // blue-500
    ctx.lineWidth = 2;
    ctx.moveTo(
      padding,
      height - padding - (mockData.values[0] * yScale)
    );

    for (let i = 1; i < mockData.dates.length; i++) {
      const xPos = padding + i * xStep;
      const yPos = height - padding - (mockData.values[i] * yScale);
      ctx.lineTo(xPos, yPos);
    }
    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.2)"); // blue-500 with opacity
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
    
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, height - padding - (mockData.values[0] * yScale));
    
    for (let i = 1; i < mockData.dates.length; i++) {
      const xPos = padding + i * xStep;
      const yPos = height - padding - (mockData.values[i] * yScale);
      ctx.lineTo(xPos, yPos);
    }
    
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw circles at data points
    for (let i = 0; i < mockData.dates.length; i++) {
      const xPos = padding + i * xStep;
      const yPos = height - padding - (mockData.values[i] * yScale);
      
      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.arc(xPos, yPos, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.strokeStyle = "#3b82f6"; // blue-500
      ctx.lineWidth = 2;
      ctx.arc(xPos, yPos, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
} 