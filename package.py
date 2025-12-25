import zipfile
import os

def pack_extension():
    # List of files and directories to include in the zip
    files_to_include = [
        'manifest.json',
        'background.js',
        'content.js',
        'popup.html',
        'popup.js',
        'styles/popup.css',
        'pages/unit-selection.html',
        'icon16.png',
        'icon48.png',
        'icon128.png'
    ]

    # Name of the output zip file
    zip_filename = 'extension.zip'

    # Create the zip file
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in files_to_include:
            if os.path.exists(file):
                zipf.write(file, arcname=file)
            else:
                print(f"Warning: {file} not found, skipping.")

    print(f"Extension packed into {zip_filename}")

if __name__ == "__main__":
    pack_extension()