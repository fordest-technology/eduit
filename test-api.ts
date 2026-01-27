
const parentId = "cmkj1c4qr002zsw80rrkjylzk";
const studentUserId = "cmkl55gj2000rswq889jc0es0";

async function testLink() {
  console.log(`Testing POST /api/parents/${parentId}/students`);
  
  const response = await fetch(`http://localhost:3000/api/parents/${parentId}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // We need a session, but let's see if we get 401 or 404
    },
    body: JSON.stringify({
      studentId: studentUserId,
      relation: "Father",
      isPrimary: true
    })
  });

  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response:", text);
}

testLink().catch(console.error);
