"use client"
import React, { useState, useEffect } from "react";
import { getExpts, createExpt, updateExpt, deleteExpt } from "./api/db.js"

const ExptPage = () => {
  const [expts, setExpts] = useState([]);
  const [newExpt, setNewExpt] = useState({ name: "" });

  useEffect(() => {
    const fetchExpts = async () => {
      const data = await getExpts();
      setExpts(data);
    };
    fetchExpts();
  }, []);

  const handleCreate = async () => {
    const expt = await createExpt(newExpt);
    setExpts([...expts, expt]);
    setNewExpt({ name: "" });
  };

  const handleUpdate = async (id, updatedData) => {
    const updatedExpt = await updateExpt(id, updatedData);
    setExpts(expts.map((expt) => (expt.id === id ? updatedExpt : expt)));
  };

  const handleDelete = async (id) => {
    await deleteExpt(id);
    setExpts(expts.filter((expt) => expt.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Experiments</h1>
      <div className="my-4">
        <input
          type="text"
          placeholder="Name"
          value={newExpt.name}
          onChange={(e) => setNewExpt({ name: e.target.value })}
          className="border p-2 mr-2"
        />
        <button onClick={handleCreate} className="bg-blue-500 text-white px-4 py-2">
          Add Experiment
        </button>
      </div>
      <ul>
        {expts.map((expt) => (
          <li key={expt.id} className="flex justify-between items-center border-b py-2">
            <div>
              <strong>{expt.name}</strong>
            </div>
            <div>
              <button
                onClick={() =>
                  handleUpdate(expt.id, { name: "Updated Experiment" })
                }
                className="bg-green-500 text-white px-2 py-1 mr-2"
              >
                Update
              </button>
              <button
                onClick={() => handleDelete(expt.id)}
                className="bg-red-500 text-white px-2 py-1"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExptPage;
