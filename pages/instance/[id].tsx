import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chart, registerables } from 'chart.js';
import { motion } from 'framer-motion';

const LineChart = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Line),
  { ssr: false }
);
const PieChart = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Pie),
  { ssr: false }
);

interface ChartPoint {
  x: number;
  y: number;
}

export default function InstanceAnalytics() {
  const router = useRouter();
  const { id } = router.query;
  const socketRef = useRef<WebSocket | null>(null);

  const [cpuPoints, setCpuPoints] = useState<ChartPoint[]>([]);
  const [gpuPoints, setGpuPoints] = useState<ChartPoint[]>([]);
  const [memPoints, setMemPoints] = useState<ChartPoint[]>([]);
  const [diskStats, setDiskStats] = useState<{ used: number; free: number } | null>(null);
  const [adapterLoaded, setAdapterLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Chart.register(...registerables);
    }
  }, []);

  // Dynamically import the date adapter and set a flag when loaded.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('chartjs-adapter-date-fns')
        .then(() => {
          console.log('chartjs-adapter-date-fns loaded');
          setAdapterLoaded(true);
        })
        .catch((err) => console.error('Error loading chartjs-adapter-date-fns:', err));
    }
  }, []);

  useEffect(() => {
    if (!router.isReady || !id) {
      console.log('Router not ready or id missing; skipping socket connection.');
      return;
    }

    const socketUrl = `ws://localhost:3001?instanceId=${id}`;
    console.log('Connecting to WebSocket:', socketUrl);
    socketRef.current = new WebSocket(socketUrl);

    socketRef.current.onmessage = (msgEvent) => {
      try {
        const msgData = JSON.parse(msgEvent.data);
        console.log('Received from server:', msgData);
        const timeStamp = new Date(msgData.timestamp).getTime();
        switch (msgData.metric) {
          case 'cpu':
            setCpuPoints((prev) => [...prev, { x: timeStamp, y: msgData.value }].slice(-100));
            break;
          case 'gpu':
            setGpuPoints((prev) => [...prev, { x: timeStamp, y: msgData.value }].slice(-100));
            break;
          case 'memory':
            setMemPoints((prev) => [...prev, { x: timeStamp, y: msgData.value }].slice(-100));
            break;
          case 'disk':
            setDiskStats({ used: msgData.used, free: msgData.free });
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (socketRef.current) {
        console.log('Closing WebSocket connection.');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [router.isReady, id]);

  const chartOptions = {
    maintainAspectRatio: false,
    scales: {
      x: { type: 'time', time: { unit: 'second' } },
      y: { beginAtZero: true },
    },
    animation: { duration: 300 },
  };

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  if (!adapterLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
        <p className="text-xl text-gray-600">Loading charts...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-10 font-sans"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">
          Analytics for Instance {id}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CPU Chart */}
          <motion.div variants={cardVariants} className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">CPU Usage (%)</h2>
            <div className="h-72 relative">
              <LineChart
                data={{
                  datasets: [
                    {
                      label: 'CPU',
                      data: cpuPoints,
                      fill: false,
                      borderColor: 'rgba(75,192,192,1)',
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </motion.div>

          <motion.div variants={cardVariants} className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">GPU Usage (%)</h2>
            <div className="h-72 relative">
              <LineChart
                data={{
                  datasets: [
                    {
                      label: 'GPU',
                      data: gpuPoints,
                      fill: false,
                      borderColor: 'rgba(255,99,132,1)',
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </motion.div>

          <motion.div variants={cardVariants} className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Memory Usage (GB)</h2>
            <div className="h-72 relative">
              <LineChart
                data={{
                  datasets: [
                    {
                      label: 'Memory',
                      data: memPoints,
                      fill: false,
                      borderColor: 'rgba(54,162,235,1)',
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </motion.div>

          <motion.div variants={cardVariants} className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Disk Usage (TB)</h2>
            <div className="h-72 relative flex items-center justify-center">
              {diskStats ? (
                <PieChart
                  data={{
                    labels: ['Used', 'Free'],
                    datasets: [
                      {
                        data: [diskStats.used, diskStats.free],
                        backgroundColor: ['#FF6384', '#36A2EB'],
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
              ) : (
                <p className="text-gray-500">Loading disk usage...</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export const config = {
  ssr: false,
};
