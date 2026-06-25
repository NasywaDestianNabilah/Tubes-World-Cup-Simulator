console.log("SCRIPT BARU");

fetch("http://localhost:3000/teams")
  .then(res => res.json())
  .then(data => {
    console.log("JUMLAH TIM:", data.length);

    let html = "";

    data.forEach(team => {
      html += `
        <div style="border:1px solid white; margin:10px; padding:10px;">
          <h3>${team.name}</h3>
          <p>${team.code}</p>
          <p>Group ${team.group}</p>
        </div>
      `;
    });

    document.getElementById("teams").innerHTML = html;
  });