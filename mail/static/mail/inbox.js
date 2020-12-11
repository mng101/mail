document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function send_email() {
    console.log('Sending email')

    // Capture the values to POST in the JSON body
    let recipients = document.getElementById("compose-recipients").value;
    let subject = document.getElementById("compose-subject").value;
    let body = document.getElementById("compose-body").value;

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({recipients:recipients, subject:subject, body:body})
    })
    .then(response => {
        console.log('Response:', response);
    })
    .then(result => {
        console.log('Result:', result);
    })
    .catch(error => {
        console.log('Error:', error);
    })

    return(false);
    // location.replace(location.origin);
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

// Fetch the emails from the selected mailbox and display the headers for each
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(data => {
            console.log('Data Received:', data);
            // Display headers for each email in the mailbox
            data.forEach(item => list_emails(item, mailbox));
        })
        .catch(error => {
            console.log('Error:', error);
        })
}

function list_emails(contents, mailbox) {
    // List headers for the emails in the mailbox
    console.log("Displaying emails in: ", mailbox);

    const element = document.createElement('div');
    element.className = 'headers';

    // Capture the UTC timestamp for conversion to the locale format
    const utcDate = new Date(contents.timestamp);

    // Display the Sender, Subject and Timestamp of the email
    // element.innerHTML = `<b>${contents.sender}</b> &nbsp&nbsp ${contents.subject} <span style="float: right">${contents.timestamp}</span>`;
    element.innerHTML = `<b>${contents.sender}</b> &nbsp&nbsp ${contents.subject} <span style="float: right">${utcDate.toLocaleString()}</span>`;

    // If the email has been read, change to a gray background
    if (contents.read === true)
        element.style.background = "#c4c4c4";

     // Add an event handler
    element.addEventListener('click', function() {
        console.log('read_email event triggered:', contents.id, mailbox);
        read_email(contents.id, mailbox);
    })

    // Add email to the DOM
    document.querySelector('#emails-view').append(element);
}

function read_email(id, mailbox){
    const email_id = id;

    console.log('Loading email ID: ', email_id)

    fetch(`/emails/${email_id}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // console.log("Display formatted email");
            show_email(data, mailbox);
        })
        .catch(error => {
            console.log('Error: ', error);
        })
}

function show_email(contents, mailbox){

    // Show the reading view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Format the email view
    const element = document.getElementById('read-view');
    document.querySelector('#read-view').innerHTML = '';
    const utcDate = new Date(contents.timestamp)

    element.innerHTML += `<h3>${contents.subject}</h3>`;
    element.innerHTML += `<b>From: </b><h6>${contents.sender} <span style="float: right">${utcDate.toLocaleString()}</span></h6>`;
    element.innerHTML += `<b>To: </b><h6>${contents.recipients.toString()}</h6>`;
    element.innerHTML += "<br>";

    const emailbodyDiv = document.createElement("div");
    emailbodyDiv.className = 'body';

    emailbodyDiv.innerHTML = `${contents.body}`;
    document.querySelector('#read-view').append(emailbodyDiv);

    // If reading email from the Sent folder, skip the Reply and Archive/Unarchive buttons
    if (mailbox !== "sent") {
        // Add the "Reply" button
        console.log("Adding Reply button");
        const btn1 = document.createElement('BUTTON');
        btn1.className = "btn btn-lg btn-primary";
        btn1.innerHTML = "Reply";
        document.querySelector('#read-view').appendChild(btn1);
        // Add an event listener to the button
        btn1.addEventListener('click', function() {
            compose_reply(contents);
        })

        // Add a 2nd button to Archive/Unarchive the email
        const btn2 = document.createElement('BUTTON');
        btn2.className = "btn btn-lg btn-primary";
        document.querySelector('#read-view').appendChild(btn2);
        if (contents.archived) {
           btn2.innerHTML = "Unarchive";
           btn2.addEventListener('click', function() {
               archive_state(contents.id, false);
           })
        } else {
            btn2.innerHTML = "Archive";
            btn2.addEventListener('click', function() {
               archive_state(contents.id, true);
           })
        }
    }

    // Mark the email as "read"
    console.log("Read flag: ", contents.read);
    if (!contents.read) {
        mark_as_read(contents.id);
    }
}

function mark_as_read(id) {
    const email_id = id;
    // console.log(typeof email_id);

    console.log("Marking as read. Email ID: ", email_id);

    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({read: true})
    })
    .then(response => {
        console.log('Response:', response);
    })
    .then(result => {
        // Print result
        console.log('Result:', result);
    })
    .catch(error => {
        console.log('Error:', error);
    });
}

function archive_state(email_id, value) {
    // Change the value of the 'archived' field
    console.log("Changing archive state: ", email_id, value);

    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({archived: value})
    })
        .then(response => {
            console.log('Response: ', response);
        })
        .then(result => {
            console.log('Result: ', result);
        })
        .catch(error => {
            console.log('Error: ', error);
        })

    location.replace(location.origin);
}

function compose_reply(original) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Populate the composition fields
    document.querySelector('#compose-recipients').value = `${original.sender}`;
    let newSubject = '';
    console.log(original.subject.substring(0,4));
    if (original.subject.substring(0,4) === 'Re: ') {
        newSubject = original.subject;
    } else {
        newSubject = 'Re: '.concat(original.subject);
    }
    document.querySelector('#compose-subject').value = newSubject;

    const utcDate = new Date(original.timestamp);
    console.log(Date(original.timestamp).toLocaleString());
    console.log(utcDate.toLocaleString());
    console.log(utcDate.toString());
    console.log(original.timestamp.toLocaleString());

    // let newBody = "\r\n";
    const dateSent = utcDate.toLocaleString('en-US', {dateStyle: 'full', timeStyle: 'long'});

    const newBody = "\r\nOn " + dateSent + " " + original.sender + " wrote:";

    // newBody += `On ${dateSent.italics()} ${(original.sender).bold()} wrote: \r\n\r\n`;
    newBody += original.body;

    document.querySelector('#compose-body').value = newBody;
}