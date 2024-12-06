import axios from "axios";

// const BASE_URL = "http://34.200.151.127:5000/api/expt";
const BASE_URL_STATUS = "http://localhost:5000/api/vehicle_status";
const BASE_URL_VALUES = "http://localhost:5000/api/vehicle_values";

export const getAllVehicleStatus = async () => {
  const response = await axios.get(BASE_URL_STATUS);
  return response.data;
};

export const getAllVehicleValues = async () => {
    const response = await axios.get(BASE_URL_VALUES);
    return response.data;
  };

export const getVehicleStatusById = async (id) => {
  const response = await axios.get(`${BASE_URL_STATUS}/${id}`);
  return response.data;
};

export const getVehicleValueById = async (id) => {
    const response = await axios.get(`${BASE_URL_STATUS}/${id}`);
    return response.data;
  };

export const updateVehicleStatusById = async (id, data) => {
  const response = await axios.put(`${BASE_URL_STATUS}/${id}`, data);
  return response.data;
};

export const updateVehicleValueById = async (id, data) => {
    const response = await axios.put(`${BASE_URL_STATUS}/${id}`, data);
    return response.data;
  };