import os
import sys
import subprocess
import requests

PARENT_ID = "1o6r55JWP9mtXav4pagu6r4E8nsGsqmvd"

def upload_file_to_gdrive(local_path, parent_id=PARENT_ID):
    resolved = os.path.abspath(local_path)
    if not os.path.exists(resolved):
        raise FileNotFoundError(f"File not found: {resolved}")

    print(f"Uploading {resolved} to Google Drive (Parent: {parent_id})...")
    cmd = f'gdrive mutate upload "{resolved}" --parent {parent_id}'
    out = subprocess.check_output(cmd, shell=True).decode("utf-8", errors="ignore").strip()
    print("Upload result:", out)

    # Extract File ID
    # Usually: "Uploaded file [name] (ID: [file_id])"
    if "ID:" in out:
        fid = out.split("ID:")[-1].strip().rstrip(")")
    else:
        raise ValueError(f"Could not parse File ID from output: {out}")

    print(f"File ID extracted: {fid}")

    # Set share to anyone reader
    share_cmd = f"gdrive mutate share {fid} --role reader --type anyone"
    subprocess.run(share_cmd, shell=True, check=True)
    print("Permissions set: anyone reader.")

    ext = os.path.splitext(resolved)[1]
    direct_url = f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t&ext={ext}"
    print(f"Direct URL generated: {direct_url}")

    # Pre-flight check
    r = requests.head(direct_url, allow_redirects=True, timeout=15)
    print(f"Pre-flight HTTP status: {r.status_code}")
    if r.status_code != 200:
        raise ValueError(f"Direct URL pre-flight failed with status {r.status_code}")

    return {
        "file_id": fid,
        "direct_url": direct_url
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
        upload_file_to_gdrive(target_file)
    else:
        print("Usage: python upload_to_gdrive.py <file_path>")
