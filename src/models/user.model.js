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
  },

  create: ({ username, password, name }) => {
    // Check if username already exists
    if (users.some(user => user.username === username)) {
      return null;
    }
    const newUser = {
      id: users.length ? users[users.length - 1].id + 1 : 1,
      username,
      password,
      name: name || username
    };
    users.push(newUser);
    return newUser;
  }
};

module.exports = User;
