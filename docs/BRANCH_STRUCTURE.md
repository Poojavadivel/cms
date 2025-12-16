# Branch Structure and Workflow Documentation

## Overview

This repository follows industry-standard Git workflow with feature branches for modular development. Each module has its own dedicated branch in the test environment.

## Repository Structure

### Production Repository
- **Repository**: [Karur-Gastro-Foundation](https://github.com/movi-innovations/Karur-Gastro-Foundation)
- **Remote Name**: `origin`
- **Branch**: `main` (protected)

### Test/Development Repository  
- **Repository**: [HMS-DEV](https://github.com/movicloudlabs-ai-testenv/HMS-DEV)
- **Remote Name**: `test`
- **Branches**: `main` + feature branches

## Feature Branches

All feature branches exist in the **test environment** repository:

| Branch Name | Module | Purpose | Contributing Guide |
|------------|--------|---------|-------------------|
| `feature/admin-module` | Admin | Administrative functions, patient management, staff management, analytics | CONTRIBUTING_ADMIN.md |
| `feature/doctor-module` | Doctor | Patient queue, prescriptions, medical records, follow-ups | CONTRIBUTING_DOCTOR.md |
| `feature/pathologist-module` | Pathologist | Lab tests, results, reports, custom tests | CONTRIBUTING_PATHOLOGIST.md |
| `feature/pharmacist-module` | Pharmacist | Inventory, stock management, dispensing, sales | CONTRIBUTING_PHARMACIST.md |
| `feature/common-module` | Common | Shared widgets, utilities, services, models | CONTRIBUTING_COMMON.md |

## Quick Start Guide

### For New Developers

```bash
# 1. Clone the test environment
git clone https://github.com/movicloudlabs-ai-testenv/HMS-DEV.git
cd HMS-DEV

# 2. View all available branches
git branch -a

# 3. Checkout your module's feature branch
git checkout feature/[module-name]

# Example:
git checkout feature/doctor-module

# 4. Create your working branch
git checkout -b feature/doctor-module-your-feature-name

# 5. Make changes, commit, and push
git add .
git commit -m "feat(doctor): your feature description"
git push origin feature/doctor-module-your-feature-name

# 6. Create Pull Request on GitHub
# Base: feature/doctor-module
# Compare: feature/doctor-module-your-feature-name
```

## Workflow Steps

### 1. Development Phase

```
Developer → Feature Branch (e.g., feature/admin-module)
                ↓
         Create working branch
                ↓
         Make changes
                ↓
         Commit and push
                ↓
         Create PR to feature branch
                ↓
         Code review
                ↓
         Merge to feature branch
```

### 2. Integration Phase

```
Feature Branch (tested and complete)
                ↓
         Create PR to main
                ↓
         Module lead + team review
                ↓
         Integration testing
                ↓
         Merge to main
                ↓
         Deploy to production
```

## Branch Rules

### Main Branch (`main`)
- ✅ Protected branch
- ✅ Requires pull request
- ✅ Requires code review approval
- ✅ Only stable, tested code
- ✅ Direct commits forbidden
- ✅ Deployed to production

### Feature Branches
- ✅ Open for team development
- ✅ Module-specific changes only
- ✅ Regular sync with main
- ✅ Can be merged to main when complete
- ✅ Module lead oversight

### Working Branches
- ✅ Individual developer branches
- ✅ Named: `feature/[module]-[feature-name]`
- ✅ Merged to feature branch via PR
- ✅ Deleted after merge

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Build/config changes

### Scopes
- `admin`: Admin module
- `doctor`: Doctor module
- `pharmacy`: Pharmacist module
- `pathology`: Pathologist module
- `common`: Common/shared module

### Examples
```bash
git commit -m "feat(admin): add user role management system"
git commit -m "fix(doctor): resolve prescription save issue"
git commit -m "docs(pharmacy): update inventory guide"
git commit -m "refactor(common): improve API error handling"
```

## Pull Request Process

### Creating a PR

1. **Push your branch**
   ```bash
   git push origin feature/[module]-[your-feature]
   ```

2. **Go to GitHub repository**
   - https://github.com/movicloudlabs-ai-testenv/HMS-DEV

3. **Click "Pull Requests" → "New Pull Request"**

4. **Select branches**
   - Base: `feature/[module-name]`
   - Compare: `feature/[module-name]-[your-feature]`

5. **Fill PR template**
   - Description of changes
   - Type of change (feature/fix/etc.)
   - Testing done
   - Screenshots (if UI changes)
   - Checklist completed

6. **Request review**
   - Tag module lead
   - Add relevant team members

### PR Review Checklist

**For Authors:**
- [ ] Code follows project conventions
- [ ] Tested locally
- [ ] No console errors
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts

**For Reviewers:**
- [ ] Code quality acceptable
- [ ] Logic is correct
- [ ] Error handling present
- [ ] Performance considerations
- [ ] Security concerns addressed
- [ ] Tests pass
- [ ] Documentation adequate

## Syncing Feature Branch with Main

**Developers should regularly sync feature branches with main:**

```bash
# 1. Switch to feature branch
git checkout feature/[module-name]

# 2. Fetch latest from main
git fetch origin main

# 3. Merge main into feature branch
git merge origin/main

# 4. Resolve any conflicts
# Edit files, then:
git add .
git commit -m "chore: merge main into feature/[module-name]"

# 5. Push updated feature branch
git push origin feature/[module-name]

# 6. Update your working branch
git checkout feature/[module-name]-[your-feature]
git merge feature/[module-name]
```

## Merging Feature Branch to Main

**Only module leads or administrators:**

```bash
# 1. Ensure feature branch is up to date
git checkout feature/[module-name]
git pull origin feature/[module-name]

# 2. Sync with main
git pull origin main

# 3. Resolve conflicts if any
git add .
git commit -m "chore: resolve merge conflicts"
git push origin feature/[module-name]

# 4. Create PR on GitHub
# Base: main
# Compare: feature/[module-name]

# 5. After approval and CI/CD passes
# Merge using GitHub interface (Squash or Merge commit)

# 6. Pull updated main
git checkout main
git pull origin main

# 7. Push to production remote
git push test main
```

## Branch Lifecycle

```
1. Create feature branch from main
         ↓
2. Developers work on feature branch
         ↓
3. Regular development and PRs
         ↓
4. Periodic sync with main
         ↓
5. Feature complete and tested
         ↓
6. Create PR to main
         ↓
7. Review and approval
         ↓
8. Merge to main
         ↓
9. Feature branch continues or archived
```

## Common Scenarios

### Scenario 1: Starting New Feature

```bash
# Checkout feature branch
git checkout feature/admin-module

# Pull latest
git pull origin feature/admin-module

# Create working branch
git checkout -b feature/admin-module-add-analytics

# Develop, commit, push
git add .
git commit -m "feat(admin): add analytics dashboard"
git push origin feature/admin-module-add-analytics

# Create PR to feature/admin-module
```

### Scenario 2: Merge Conflict Resolution

```bash
# During merge, conflicts occur
git status  # Shows conflicted files

# Edit files to resolve conflicts
# Look for <<<<<<, =======, >>>>>> markers

# After resolving
git add .
git commit -m "chore: resolve merge conflicts"
git push
```

### Scenario 3: Switching Between Modules

```bash
# Save current work
git add .
git commit -m "wip: save progress"
git push

# Switch to another module
git checkout feature/doctor-module
git pull origin feature/doctor-module

# Create new branch or checkout existing
git checkout -b feature/doctor-module-new-feature
```

## Documentation

Each feature branch has its own detailed contributing guide:

| Module | Guide Location | Focus Areas |
|--------|---------------|-------------|
| Admin | `CONTRIBUTING_ADMIN.md` | Patient management, appointments, staff, analytics |
| Doctor | `CONTRIBUTING_DOCTOR.md` | Prescriptions, medical records, patient care |
| Pathologist | `CONTRIBUTING_PATHOLOGIST.md` | Lab tests, results, reports, quality control |
| Pharmacist | `CONTRIBUTING_PHARMACIST.md` | Inventory, stock levels, dispensing, sales |
| Common | `CONTRIBUTING_COMMON.md` | Shared components, utilities, services |

## Best Practices

1. **Commit Often**: Small, focused commits
2. **Pull Regularly**: Stay updated with feature branch
3. **Test Thoroughly**: Before pushing and in PR
4. **Write Clear Messages**: Descriptive commit messages
5. **Review Code**: Participate in code reviews
6. **Document Changes**: Update relevant documentation
7. **Communicate**: Discuss major changes with team
8. **Clean Up**: Delete merged branches

## Tools and Commands

### Useful Git Commands

```bash
# View all branches
git branch -a

# View current branch
git branch --show-current

# View commit history
git log --oneline --graph --all

# Check status
git status

# View changes
git diff

# Stash changes temporarily
git stash
git stash pop

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View remote URLs
git remote -v

# Update remote URLs
git remote set-url origin <new-url>
```

## Support and Resources

- **Main Documentation**: README.md
- **General Contributing**: See README.md Contributing section
- **Module-Specific**: CONTRIBUTING_[MODULE].md files
- **Issues**: GitHub Issues
- **Questions**: Contact module leads

## Repository Contacts

- **Admin Module Lead**: [Contact Info]
- **Doctor Module Lead**: [Contact Info]
- **Pathologist Module Lead**: [Contact Info]
- **Pharmacist Module Lead**: [Contact Info]
- **Common Module Lead**: [Contact Info]
- **Project Administrator**: [Contact Info]

---

**Last Updated**: December 5, 2025  
**Version**: 1.0  
**Status**: Active Development

## Summary

✅ 5 Feature branches created in test environment  
✅ Each branch has dedicated contributing guide  
✅ Industry-standard Git workflow implemented  
✅ Clear path from development to production  
✅ Documentation complete for all modules  

**Test Environment**: https://github.com/movicloudlabs-ai-testenv/HMS-DEV  
**Production**: https://github.com/movi-innovations/Karur-Gastro-Foundation
