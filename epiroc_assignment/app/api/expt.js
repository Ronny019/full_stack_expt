import axios from "axios";

const BASE_URL = "http://34.200.151.127:5000/api/expt";

export const getExpts = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

export const getExpt = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const createExpt = async (data) => {
  const response = await axios.post(BASE_URL, data);
  return response.data;
};

export const updateExpt = async (id, data) => {
  const response = await axios.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteExpt = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
