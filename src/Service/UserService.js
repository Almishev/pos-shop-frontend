import axios from "axios";

export const addUser = async (user) => {
   return await axios.post('/api/admin/register', user, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const deleteUser = async (id) => {
    return await axios.delete(`/api/admin/users/${id}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const fetchUsers = async () => {
    return await axios.get('/api/admin/users', {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}
