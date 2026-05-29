$git = "C:\Users\daytr\AppData\Local\Programs\Git\cmd\git.exe"
Write-Host "Using Git from: $git"

# 1. Remove old .git folder
if (Test-Path .git) {
    Write-Host "Removing old .git directory..."
    Remove-Item -Path .git -Recurse -Force -ErrorAction SilentlyContinue
}

# 2. Init fresh repo
Write-Host "Initializing fresh Git repository..."
& $git init

# 3. Configure local git credentials (ensures commit succeeds without prompts)
& $git config user.name "autonomistudios"
& $git config user.email "admin@autonomistudios.com"

# 4. Add all files
Write-Host "Staging all project files..."
& $git add .

# 5. Commit
Write-Host "Committing changes..."
& $git commit -m "Initial commit - LuxAura Creation Studio 2 (Secured & Refactored)"

# 6. Branch
Write-Host "Renaming branch to main..."
& $git branch -M main

# 7. Remote
Write-Host "Adding remote origin..."
& $git remote add origin https://github.com/autonomistudios/luxura.git

# 8. Push
Write-Host "Pushing to GitHub (Force)..."
& $git push -u origin main -f
