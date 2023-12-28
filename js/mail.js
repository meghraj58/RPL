

  function sendMail() {
    let name = document.getElementById("Name").value;
    let email = document.getElementById("Email").value;
    let phoneNo = document.getElementById("Phone").value;
    let message = document.getElementById("Message").value;
    let emailBody = "Name: " + name + "<br/>Email: " + email + "<br/>Phone: " + phoneNo + "<br/>Message: " + message;

    Email.send({
      SecureToken: "e9ba95e0-b278-47ba-9396-1cf8388fab1c",
      To: 'rpl.tournament.howrah@outlook.com',
      From: "rpl.tournament.howrah@outlook.com",
      Subject: "Contact Message from " + name,
      Body: emailBody
    }).then(
      message => {
        // Reset the form
        document.getElementById("Name").value = "";
          document.getElementById("Email").value = "";
          document.getElementById("Phone").value = "";
          document.getElementById("Message").value = "";
          let modalContent;
          let head;
          if (message === 'OK') {
              head = <h1><i class="bi-check-circle-fill"></i> Success!</h1>;
              modalContent = `
                  <div class="modal-body">
                      <p>Your message has been sent successfully.</p>
                  </div>
              `;
          } else {
              head = <h1><i class="bi-exclamation-octagon-fill"></i>  Error Sending Message</h1>;
              modalContent = `
                  <div class="modal-body">
                      <p>${message}</p>
                  </div>
              `;
          }
  
          // Create a new Bootstrap modal element
          const modal = document.createElement('div');
          modal.className = 'modal fade';
          modal.innerHTML = `
              <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content">
                      <div class="modal-header alert alert-warning">
                      <h5 class="modal-title" id="exampleModalLongTitle">${head}</h5>
                      <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                      </button>
                  </div>
                      ${modalContent}
                  </div>
              </div>
          `;
  
          document.body.appendChild(modal);
          $(modal).modal('show');
  
       }
    );
  }