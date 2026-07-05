async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ui_user@test.com', password: 'password123' })
    });
    
    // Just try a known user if the first fails
    let token = '';
    if (loginRes.ok) {
        const loginData = await loginRes.json();
        token = loginData.token;
    } else {
        const loginRes2 = await fetch('http://localhost:5000/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'testuser@test.com', password: 'password123' })
        });
        if (loginRes2.ok) {
            token = (await loginRes2.json()).token;
        } else {
            console.log("Could not login");
            return;
        }
    }

    const res = await fetch('http://localhost:5000/api/ai/summarize', {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ transcript: "User: Hello\nFriend: Hi" })
    });
    
    if (!res.ok) {
        console.log("Error status:", res.status);
        console.log("Error body:", await res.text());
    } else {
        console.log("Success:", await res.json());
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

test();
