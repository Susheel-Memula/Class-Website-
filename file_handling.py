from flask import Flask, request, render_template, jsonify, send_from_directory
import os
import mimetypes

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure uploads folder exists
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "jpg", "png"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# 📌 Load the homepage (hi.html)
@app.route("/")
def index():
    return render_template("hi.html")

# 📌 Handle file upload (AJAX, no redirect)
@app.route("/upload", methods=["POST"])
def upload_file():
    subject = request.form.get("subject")
    if not subject:
        return jsonify({"error": "Subject not specified"}), 400

    subject_folder = os.path.join(app.config["UPLOAD_FOLDER"], subject)
    os.makedirs(subject_folder, exist_ok=True)  # Create subject folder if missing

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = file.filename
        filepath = os.path.join(subject_folder, filename)

        # Prevent overwriting files by renaming duplicates
        counter = 1
        while os.path.exists(filepath):
            name, ext = os.path.splitext(filename)
            filename = f"{name}_{counter}{ext}"
            filepath = os.path.join(subject_folder, filename)
            counter += 1

        file.save(filepath)
        return jsonify({"message": "File uploaded successfully!", "filename": filename})

    return jsonify({"error": "Invalid file type"}), 400

# 📌 Fetch list of uploaded files for a subject
@app.route("/files/<subject>")
def list_files(subject):
    subject_folder = os.path.join(app.config["UPLOAD_FOLDER"], subject)
    if not os.path.exists(subject_folder):
        return jsonify({"files": []})  # Return empty list if no files exist

    files = os.listdir(subject_folder)
    return jsonify({"files": files})  # Return JSON list of files

# 📌 Serve uploaded files (view & download)
@app.route("/uploads/<subject>/<filename>")
def uploaded_file(subject, filename):
    subject_folder = os.path.join(app.config["UPLOAD_FOLDER"], subject)

    # Check if file exists
    if not os.path.exists(os.path.join(subject_folder, filename)):
        return jsonify({"error": "File not found"}), 404

    # Guess the MIME type for proper file serving
    mime_type, _ = mimetypes.guess_type(filename)
    return send_from_directory(subject_folder, filename, mimetype=mime_type)

if __name__ == "__main__":
    app.run(debug=True)
