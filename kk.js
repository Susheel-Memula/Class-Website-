document.addEventListener("DOMContentLoaded", function () {
    showSubject("DS"); // Auto-load default subject

    // Attach click event to subject links
    document.querySelectorAll(".subject-link").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            let subject = this.getAttribute("data-subject");
            showSubject(subject);
        });
    });

    // File input handling
    let fileInput = document.getElementById("file-input");
    let dropArea = document.getElementById("drop-area");
    let fileNameDisplay = document.getElementById("file-name");

    dropArea.addEventListener("click", function () {
        fileInput.click();
    });

    fileInput.addEventListener("change", function () {
        fileNameDisplay.textContent = fileInput.files.length ? fileInput.files[0].name : "No file chosen";
    });

    // Drag & Drop handling
    dropArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropArea.style.background = "#e9ecef";
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.style.background = "white";
    });

    dropArea.addEventListener("drop", (event) => {
        event.preventDefault();
        fileInput.files = event.dataTransfer.files;
        fileNameDisplay.textContent = fileInput.files.length ? fileInput.files[0].name : "No file chosen";
    });

    // File upload handling
    document.getElementById("upload-form").addEventListener("submit", function (e) {
        e.preventDefault();

        let selectedSubject = document.querySelector(".selected-subject").textContent;
        if (fileInput.files.length === 0) {
            alert("Please select a file.");
            return;
        }

        let formData = new FormData();
        formData.append("subject", selectedSubject);
        formData.append("file", fileInput.files[0]);

        fetch("/upload", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("Upload failed: " + data.error);
            } else {
                alert(data.message);
                showSubject(selectedSubject); // Refresh file list after upload
                fileNameDisplay.textContent = "No file chosen"; // Reset file name
                fileInput.value = ""; // Clear file input after upload
            }
        })
        .catch(error => console.error("Error uploading file:", error));
    });
});

// Function to load files for a subject
function showSubject(subject) {
    document.getElementById("subject-title").innerText = subject;
    document.querySelector(".selected-subject").textContent = subject;
    document.getElementById("uploaded-files").innerHTML = "<p>Loading files for " + subject + "...</p>";

    fetch(`/files/${subject}`)
        .then(response => response.json())
        .then(data => {
            let fileList = data.files.length === 0 ? "<p>No files uploaded yet.</p>" : "";
            data.files.forEach(file => {
                let filePreview = getFilePreview(subject, file);
                fileList += `
                    <div class="file-item">
                        ${filePreview}
                        <span>${file}</span>
                        <div class="file-actions">
                            <a href="/uploads/${subject}/${file}" target="_blank">View</a>
                            <a href="/uploads/${subject}/${file}" download>Download</a>
                        </div>
                    </div>`;
            });

            document.getElementById("uploaded-files").innerHTML = fileList;
            loadPDFPreviews(); // Load PDF previews
        })
        .catch(error => console.error("Error fetching files:", error));
}

// Function to get file preview
function getFilePreview(subject, file) {
    let ext = file.split('.').pop().toLowerCase();
    if (["jpg", "jpeg", "png"].includes(ext)) {
        return `<img src="/uploads/${subject}/${file}" class="file-preview" alt="Image Preview">`;
    } else if (ext === "pdf") {
        return `<canvas class="pdf-preview" data-pdf="/uploads/${subject}/${file}"></canvas>`;
    } else {
        return `<span class="file-icon">📄</span>`; // Default icon
    }
}

// Function to load PDF previews using pdf.js
function loadPDFPreviews() {
    document.querySelectorAll(".pdf-preview").forEach(canvas => {
        let url = canvas.getAttribute("data-pdf");
        pdfjsLib.getDocument(url).promise.then(pdf => {
            pdf.getPage(1).then(page => {
                let viewport = page.getViewport({ scale: 0.5 });
                let context = canvas.getContext("2d");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                page.render({ canvasContext: context, viewport: viewport });
            });
        }).catch(error => {
            console.error("Error loading PDF preview:", error);
        });
    });
}
