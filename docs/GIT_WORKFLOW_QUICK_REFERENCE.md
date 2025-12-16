# Git Workflow Quick Reference Guide

## 📍 Where to Find Complete Documentation

- **README.md** (Root) - Complete branch workflow in Contributing section
- **documents/BRANCH_STRUCTURE.md** - Comprehensive branch documentation with all rules
- **Feature Branch CONTRIBUTING Files** - Module-specific guides in each feature branch

## 🚀 Quick Start - 3 Steps

### Step 1: Clone & Checkout
```bash
git clone https://github.com/movicloudlabs-ai-testenv/HMS-DEV.git
cd HMS-DEV
git checkout feature/[module-name]
```

### Step 2: Create Your Branch
```bash
git checkout -b feature/[module-name]-[your-feature]
```

### Step 3: Commit & Push
```bash
git add .
git commit -m "feat(module): description"
git push origin feature/[module-name]-[your-feature]
```

## 🔐 Branch Protection Rules

### ❌ Main Branch - PROTECTED
- **NO direct commits allowed**
- **Requires Pull Request** with approval
- **Requires code review** from module lead
- **CI/CD must pass** before merge
- **Only stable code** allowed

### ✅ Feature Branches - OPEN
- Team collaboration allowed
- Module-specific work only
- Merge to main when complete
- Regular sync with main required

### ✅ Working Branches - INDIVIDUAL
- Your personal development branch
- Merge to feature branch via PR
- Delete after successful merge

## 📋 Pull Request Rules

### PR to Feature Branch (Daily Development)
1. **Base**: `feature/[module-name]`
2. **Compare**: `feature/[module-name]-[your-feature]`
3. **Review**: Team member or module lead
4. **Approval**: 1 approval required
5. **Merge**: Squash or regular merge OK

### PR to Main Branch (Module Integration)
1. **Base**: `main`
2. **Compare**: `feature/[module-name]`
3. **Review**: Module lead + senior developer
4. **Approval**: Minimum 2 approvals required
5. **Testing**: All tests must pass
6. **Documentation**: Must be updated
7. **Merge**: Use merge commit (preserve history)
8. **Who Can Create**: Module leads only

## 🔄 Push & Pull Rules

### Pushing Rules

#### ✅ Allowed Pushes
```bash
# To your working branch - ALWAYS ALLOWED
git push origin feature/admin-module-add-feature

# To feature branch - ALLOWED (but PR preferred)
git push origin feature/admin-module

# To test remote - ALLOWED
git push test feature/admin-module
```

#### ❌ Forbidden Pushes
```bash
# Direct push to main - FORBIDDEN
git push origin main  # ❌ Will be rejected

# Force push to main - FORBIDDEN  
git push origin main --force  # ❌ Will be rejected

# Push without commit message convention - DISCOURAGED
git push origin feature/admin-module-fix  # ❌ Use proper format
```

### Pulling Rules

#### Daily Pull Routine
```bash
# Morning: Update your feature branch
git checkout feature/admin-module
git pull origin feature/admin-module

# Update your working branch
git checkout feature/admin-module-add-feature
git merge feature/admin-module
```

#### Before Creating PR
```bash
# Ensure up-to-date with feature branch
git checkout feature/admin-module
git pull origin feature/admin-module

git checkout feature/admin-module-add-feature
git merge feature/admin-module

# Resolve conflicts if any
git add .
git commit -m "chore: resolve merge conflicts"
```

## 🔀 Merge to Main Process

### Prerequisites (ALL Must Be True)
- ✅ Feature branch fully tested
- ✅ All team PRs merged to feature branch
- ✅ No critical bugs
- ✅ Documentation updated
- ✅ Module lead approval
- ✅ Integration test passed
- ✅ No conflicts with main

### Step-by-Step Process

#### Step 1: Module Lead Prepares Feature Branch
```bash
# Switch to feature branch
git checkout feature/admin-module

# Pull latest from feature branch
git pull origin feature/admin-module

# Pull latest from main
git pull origin main

# Resolve conflicts if any
git add .
git commit -m "chore: sync with main before merge"

# Push updated feature branch
git push origin feature/admin-module
```

#### Step 2: Create PR to Main
```bash
# On GitHub:
1. Go to: https://github.com/movicloudlabs-ai-testenv/HMS-DEV
2. Click "Pull Requests" → "New Pull Request"
3. Base: main
4. Compare: feature/admin-module
5. Title: "feat(admin): [Feature name] - Ready for production"
6. Description: Complete feature summary, testing notes
7. Tag: All module leads + reviewers
```

#### Step 3: Review & Approval Process
```
Module Lead creates PR
         ↓
All module leads notified
         ↓
Code review by minimum 2 leads
         ↓
Integration testing performed
         ↓
All approvals obtained
         ↓
CI/CD passes (if configured)
         ↓
Project admin merges to main
```

#### Step 4: Post-Merge Actions
```bash
# Pull updated main
git checkout main
git pull origin main

# Push to production remote
git push test main

# Update feature branch with new main
git checkout feature/admin-module
git merge main
git push origin feature/admin-module

# Notify team to update their branches
```

## 🔄 Adding Changes to Main

### Method 1: Via Feature Branch (Preferred)
```bash
# Work on feature branch
git checkout feature/admin-module
# Make changes
git add .
git commit -m "feat(admin): new feature"
git push origin feature/admin-module

# When ready, create PR to main
# Base: main ← Compare: feature/admin-module
```

### Method 2: Hot Fix to Main (Emergency Only)
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix the issue
git add .
git commit -m "fix: critical security issue"
git push origin hotfix/critical-bug

# Create PR: Base: main ← Compare: hotfix/critical-bug
# Requires immediate admin approval

# After merge, update all feature branches
git checkout feature/admin-module
git pull origin main
git push origin feature/admin-module
```

## 📊 Commit Message Format (REQUIRED)

### Format
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types (Required)
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Build/config changes

### Scopes (Required)
- `admin`: Admin module
- `doctor`: Doctor module
- `pharmacy`: Pharmacist module
- `pathology`: Pathologist module
- `common`: Common module

### Examples
```bash
✅ GOOD
git commit -m "feat(admin): add role-based access control"
git commit -m "fix(doctor): resolve prescription save error"
git commit -m "docs(pharmacy): update inventory guide"

❌ BAD
git commit -m "fixed bug"
git commit -m "updates"
git commit -m "changes"
```

## 🚫 What NOT to Do

### ❌ Never Do These
```bash
# Direct commit to main
git checkout main
git commit -m "fix"
git push origin main  # ❌ FORBIDDEN

# Force push to main
git push origin main --force  # ❌ FORBIDDEN

# Force push to shared feature branch
git push origin feature/admin-module --force  # ❌ DISCOURAGED

# Commit large files
git add large-file.zip  # ❌ Use .gitignore

# Push without testing
git commit -am "fix" && git push  # ❌ TEST FIRST

# Merge without pull
git merge feature-branch  # ❌ Pull first
```

### ⚠️ Avoid These
```bash
# Working directly on feature branch
git checkout feature/admin-module
# Make changes  # ⚠️ Create working branch instead

# Pushing incomplete work to feature branch
git push origin feature/admin-module  # ⚠️ Create PR from working branch

# Not syncing with main regularly
# Last sync: 2 weeks ago  # ⚠️ Sync weekly
```

## ✅ Best Practices

### Daily Workflow
```bash
# Morning
git checkout feature/admin-module
git pull origin feature/admin-module
git checkout feature/admin-module-my-feature
git merge feature/admin-module

# Work
# Make changes, commit frequently

# Evening
git add .
git commit -m "feat(admin): progress on feature"
git push origin feature/admin-module-my-feature
```

### Weekly Workflow
```bash
# Sync feature branch with main
git checkout feature/admin-module
git pull origin main
git push origin feature/admin-module

# Update your working branch
git checkout feature/admin-module-my-feature
git merge feature/admin-module
```

### Before Vacation/Break
```bash
# Push all work
git add .
git commit -m "wip: save progress before break"
git push origin feature/admin-module-my-feature

# Document current state
# Create issue or comment in PR with status
```

## 🆘 Troubleshooting

### Merge Conflict
```bash
# During merge
git merge feature/admin-module
# CONFLICT in file.dart

# Resolve conflicts
# Edit file, remove <<<<<<, ======, >>>>>>
git add file.dart
git commit -m "chore: resolve merge conflicts"
git push
```

### Accidentally Committed to Wrong Branch
```bash
# Reset last commit
git reset --soft HEAD~1

# Switch to correct branch
git checkout correct-branch

# Commit again
git add .
git commit -m "feat(admin): feature"
```

### Need to Update Commit Message
```bash
# For last commit
git commit --amend -m "new message"

# If not pushed yet
git push

# If already pushed
git push --force origin your-branch  # ⚠️ Only on your branch
```

## 📞 Need Help?

### Module-Specific Questions
- **Admin**: Check `CONTRIBUTING_ADMIN.md` in feature/admin-module
- **Doctor**: Check `CONTRIBUTING_DOCTOR.md` in feature/doctor-module
- **Pathology**: Check `CONTRIBUTING_PATHOLOGIST.md` in feature/pathologist-module
- **Pharmacy**: Check `CONTRIBUTING_PHARMACIST.md` in feature/pharmacist-module
- **Common**: Check `CONTRIBUTING_COMMON.md` in feature/common-module

### General Questions
- Read **README.md** Contributing section
- Read **documents/BRANCH_STRUCTURE.md**
- Contact module lead
- Create GitHub issue

## 📚 Complete Documentation Links

1. **README.md** - Main documentation in root
2. **documents/BRANCH_STRUCTURE.md** - Complete branch structure
3. **documents/CONTRIBUTING_ADMIN.md** - Admin module (in feature/admin-module branch)
4. **documents/CONTRIBUTING_DOCTOR.md** - Doctor module (in feature/doctor-module branch)
5. **documents/CONTRIBUTING_PATHOLOGIST.md** - Pathology module (in feature/pathologist-module branch)
6. **documents/CONTRIBUTING_PHARMACIST.md** - Pharmacy module (in feature/pharmacist-module branch)
7. **documents/CONTRIBUTING_COMMON.md** - Common module (in feature/common-module branch)

---

**Quick Reference Version**: 1.0  
**Last Updated**: December 5, 2025  
**For**: Karur Gastro Foundation HMS Project

**Remember**: When in doubt, create a PR instead of direct push! 🚀
