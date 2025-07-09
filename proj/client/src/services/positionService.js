import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const API_URL = `${API_BASE_URL}/api/positions`;

const getPositions = async (token) => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

const addPosition = async (name, token) => {
  const res = await axios.post(API_URL, { name }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

const updatePosition = async (id, name, token) => {
  const res = await axios.put(`${API_URL}/${id}`, { name }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

const deletePosition = async (id, token) => {
  const res = await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export default {
  getPositions,
  addPosition,
  updatePosition,
  deletePosition
}; 