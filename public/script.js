// script.js
window.onload = function() {
  chargerCremesGlacees();
  chargerCommandes();
  document
    .getElementById("addItemButton")
    .addEventListener("click", envoyerCommande);
};

function chargerCremesGlacees() {
  fetch("/api/cremes-glacees")
    .then(res => res.json())
    .then(cremes => {
      const table = document.getElementById("tableSaveurs");
      table.innerHTML = "";
      cremes.forEach((creme, index) => {
        const tr = document.createElement("tr");
        const tdRadio = document.createElement("td");
        const tdLabel = document.createElement("td");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "saveur";
        input.id = "saveur-" + creme.id;
        input.value = creme.nom;
        if (index === 0) {
          input.checked = true;
        }

        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.textContent = creme.nom;

        tdRadio.appendChild(input);
        tdLabel.appendChild(label);
        tr.appendChild(tdRadio);
        tr.appendChild(tdLabel);
        table.appendChild(tr);
      });
    });
}

function chargerCommandes() {
  fetch("/api/commandes")
    .then(res => res.json())
    .then(donnees => {
      const ul = document.getElementById("mesCommandes");
      ul.innerHTML = "";
      donnees.forEach(cmd => {
        const li = document.createElement("li");
        li.textContent = `${cmd.dateHeure}  -  "${cmd.format}" crème glacée "${cmd.saveur}"`;
        ul.appendChild(li);
      });
    });
}

function envoyerCommande() {
  const radioFormat = document.getElementsByName("format");
  const radioSaveur = document.getElementsByName("saveur");
  let format;
  let saveur;

  for (let i = 0; i < radioFormat.length; i++) {
    if (radioFormat[i].checked) {
      format = radioFormat[i].value;
      break;
    }
  }

  for (let i = 0; i < radioSaveur.length; i++) {
    if (radioSaveur[i].checked) {
      saveur = radioSaveur[i].value;
      break;
    }
  }

  fetch("/api/commandes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, saveur })
  })
    .then(res => res.json())
    .then(() => {
      chargerCommandes();
    });
}
