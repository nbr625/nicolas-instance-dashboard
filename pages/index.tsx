import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Instance {
  id: number;
  name: string;
  ip: string;
}

export default function HomePage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [instName, setInstName] = useState('');
  const [instIP, setInstIP] = useState('');

  useEffect(() => {
    fetch('/api/instances')
      .then(response => response.json())
      .then(setInstances);
  }, []);

  const handleAddInstance = async () => {
    const response = await fetch('/api/instances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: instName, ip: instIP }),
    });
    const newInstance = await response.json();
    setInstances(prev => [...prev, newInstance]);
    setInstName('');
    setInstIP('');
  };

  const handleDeleteInstance = async (instanceId: number) => {
    await fetch(`/api/instances?id=${instanceId}`, { method: 'DELETE' });
    setInstances(prev => prev.filter(item => item.id !== instanceId));
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const listItemHover = {
    scale: 1.02,
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 flex items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="bg-white shadow-xl rounded-lg w-full max-w-3xl p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
          Instance Dashboard
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <input
            type="text"
            placeholder="Instance Name"
            value={instName}
            onChange={(e) => setInstName(e.target.value)}
            className="border border-gray-300 p-3 rounded w-full sm:w-auto flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Instance IP"
            value={instIP}
            onChange={(e) => setInstIP(e.target.value)}
            className="border border-gray-300 p-3 rounded w-full sm:w-auto flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleAddInstance}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors"
          >
            Add Instance
          </button>
        </div>
        {instances.length === 0 ? (
          <p className="text-center text-gray-500">No instances yet. Add one above!</p>
        ) : (
          <ul className="space-y-4">
            {instances.map(({ id, name, ip }) => (
              <motion.li
                key={id}
                whileHover={listItemHover}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 p-4 rounded shadow-sm"
              >
                <Link href={`/instance/${id}`} className="text-blue-600 font-medium hover:underline">
                  {name} ({ip})
                </Link>
                <button
                  onClick={() => handleDeleteInstance(id)}
                  className="mt-2 sm:mt-0 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
