---
description: Deploy My Invoice Apps to production via git push
---

// turbo-all

1. Build the project:
```
npm run build
```

2. Stage all changes:
```
git add .
```

3. Commit with a descriptive message (replace the message with something relevant to recent changes):
```
git commit -m "fix: <describe the change>"
```

4. Force push to main branch (this triggers the hosting provider to redeploy automatically):
```
git push --force
```

> Note: PowerShell does not support `&&` chaining. Always run each command separately.
