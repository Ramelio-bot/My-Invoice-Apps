import re

# Fix PenawaranHarga.jsx
file = r"src\pages\PenawaranHarga.jsx"
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

# The problem: LimitModal is outside root div with </> fragment
# Fix: move it inside div (swap order) and fix closing
bad = (
    '''            }\r\n'''
    '''        </div >\r\n'''
    '''            {showLimitModal && <LimitModal plan="PRO" feature="Penawaran Harga" onClose={() => setShowLimitModal(false)} />\r\n'''
    '''    </>);\r\n'''
    '''}'''
)
good = (
    '''            }\r\n'''
    '''            {showLimitModal && <LimitModal plan="PRO" feature="Penawaran Harga" onClose={() => setShowLimitModal(false)} />}\r\n'''
    '''        </div >\r\n'''
    '''    );\r\n'''
    '''}'''
)

if bad in content:
    content = content.replace(bad, good)
    print("PenawaranHarga: pattern found and fixed")
else:
    # Try with LF
    bad_lf = bad.replace('\r\n', '\n')
    good_lf = good.replace('\r\n', '\n')
    if bad_lf in content:
        content = content.replace(bad_lf, good_lf)
        print("PenawaranHarga: LF pattern found and fixed")
    else:
        print("PenawaranHarga: pattern NOT found - printing last 6 lines:")
        for i, line in enumerate(content.split('\n')[-8:], 1):
            print(f"  [{line!r}]")

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done PenawaranHarga")
