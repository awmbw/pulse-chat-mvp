const axios = require('axios');

async function test() {
  try {
    // Login to get token
    const login = await axios.post('http://localhost:5000/api/users/login', {
      email: 'ui_user@test.com', // Let's try to login as any user, or just make a mock token if needed
      password: 'password123'
    });
    const token = login.data.token;
    console.log("Logged in");

    const res = await axios.post('http://localhost:5000/api/ai/summarize', {
      transcript: "User: Hello\nFriend: Hi"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
