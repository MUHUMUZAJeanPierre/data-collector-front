import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',  
});

export const getTeamMembers = () => API.get('teammembers/');
export const createTeamMember = (data) => API.post('teammembers/', data);
export const updateTeamMember = (id, data) => API.put(`teammembers/${id}/`, data);
export const deleteTeamMember = (id) => API.delete(`teammembers/${id}/`);
