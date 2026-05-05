// MAKE FUNCTION GLOBAL
window.openDonateModal = function () {
  let modal = document.getElementById("donate-modal");

  if (!modal) {
    alert("Donation system loading...");
    return;
  }

  modal.style.display = "block";
};

// OPTIONAL: close handler
window.closeDonateModal = function () {
  let modal = document.getElementById("donate-modal");
  if (modal) {
    modal.style.display = "none";
  }
};
