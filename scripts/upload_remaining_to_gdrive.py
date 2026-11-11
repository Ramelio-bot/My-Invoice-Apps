import os
import sys
from upload_to_gdrive import upload_file_to_gdrive

files = [
    "Konten Upload/Feed-07_Penawaran_Deal_Konversi_Invoice.jpg",
    "Konten Upload/Feed-08_Pusing_Rekap_Omset_Pajak_UMKM.jpg"
]

results = {}
for f in files:
    res = upload_file_to_gdrive(f)
    results[f] = res
    print(f"Uploaded {f} => {res['direct_url']}")

print("\n=== ALL GDrive UPLOADS COMPLETE ===")
import json
print(json.dumps(results, indent=2))
