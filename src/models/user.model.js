// In a real application, you would use a database to store users
// This is a simple in-memory implementation for demonstration purposes

const users = [
  {
    id: 1,
    username: 'testuser',
    password: 'password123',
    name: 'Test User'
  }
];

const User = {
  findByCredentials: (username, password) => {
    return users.find(user => user.username === username && user.password === password);
  },

  findById: (id) => {
    return users.find(user => user.id === id);
  }
};

module.exports = User;
