# 🔄 **GitHub Workflow Guide - Solo Developer**
## Best Practices for Two-Device Development

### 📋 **Document Overview**
- **Purpose**: GitHub workflow best practices for solo developer using multiple devices
- **Target Audience**: Solo Developer (Primary), Future Team Members
- **Version**: 1.0
- **Last Updated**: August 24, 2025

---

## 🎯 **CORE PRINCIPLE**
**Always pull before work, always push after work** - This prevents 99% of conflicts in solo development.

---

## 🔄 **DAILY WORKFLOW**

### **Starting Work Session**
```bash
# 1. Navigate to project directory
cd "path/to/BRD-PRD App claude/brd-prd-app"

# 2. Check current branch
git branch

# 3. Switch to main if needed
git checkout main

# 4. Pull latest changes
git pull origin main

# 5. Start working...
```

### **Ending Work Session**
```bash
# 1. Check what changed
git status

# 2. Add all changes
git add .

# 3. Commit with descriptive message
git commit -m "Add payment gateway comparison document and update roadmap"

# 4. Push to remote
git push origin main
```

---

## 📱 **TWO-DEVICE STRATEGY**

### **Recommended: Simple Main Branch Workflow**
- Work directly on `main` branch for day-to-day development
- Use feature branches only for major experimental features
- Ideal for solo development with quick iterations

### **Device Switching Protocol**
1. **Before leaving Device A:**
   ```bash
   git add .
   git commit -m "Work in progress: feature description"
   git push origin main
   ```

2. **When starting on Device B:**
   ```bash
   git pull origin main
   # Continue working...
   ```

---

## 🌿 **BRANCHING STRATEGIES**

### **For Major Features/Experiments**
```bash
# Create and switch to feature branch
git checkout -b feature/stripe-integration

# Work on feature...
git add .
git commit -m "Implement Stripe payment processing"
git push origin feature/stripe-integration

# When ready to merge
git checkout main
git pull origin main
git merge feature/stripe-integration
git push origin main

# Clean up
git branch -d feature/stripe-integration
git push origin --delete feature/stripe-integration
```

### **Current Project Branches**
- `main` - Production-ready code
- `backup-24-8-2025-v2` - Current working branch
- `backup` - Previous backup
- `Backup-2025-8-24` - Another backup point

---

## 🛡️ **SAFETY PRACTICES**

### **Conflict Prevention**
```bash
# Use rebase for cleaner history
git pull --rebase origin main

# Check status before major operations
git status

# View recent commits
git log --oneline -5
```

### **Emergency Recovery**
```bash
# If you need to discard local changes
git stash  # Save changes temporarily
git stash drop  # Delete saved changes

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Hard reset to remote state (DANGEROUS - loses all local changes)
git reset --hard origin/main
```

---

## 📝 **COMMIT MESSAGE STANDARDS**

### **Format**
```
Type: Brief description

Optional longer description
```

### **Types**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting
- `refactor:` Code restructuring
- `test:` Add/update tests
- `chore:` Maintenance tasks

### **Examples**
```bash
git commit -m "feat: add PayPal integration for Saudi market"
git commit -m "fix: resolve email verification bug in auth flow"
git commit -m "docs: update payment gateway comparison document"
git commit -m "refactor: optimize AI model selection logic"
```

---

## 🔍 **USEFUL COMMANDS**

### **Status & Information**
```bash
# Check repository status
git status

# View commit history
git log --oneline -10

# See changes in files
git diff

# Check remote branches
git branch -r

# See who changed what
git blame filename.js
```

### **Branch Management**
```bash
# List all branches
git branch -a

# Switch branches
git checkout branch-name

# Create and switch to new branch
git checkout -b new-branch-name

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

**1. "Your branch is behind 'origin/main'"**
```bash
git pull origin main
```

**2. "Your branch is ahead of 'origin/main'"**
```bash
git push origin main
```

**3. Merge Conflicts**
```bash
# 1. Pull latest changes
git pull origin main

# 2. Git will mark conflict files
# 3. Open conflicted files and resolve manually
# 4. Look for conflict markers:
#    <<<<<<< HEAD
#    your changes
#    =======
#    remote changes
#    >>>>>>> branch-name

# 5. After resolving conflicts:
git add .
git commit -m "resolve merge conflicts"
git push origin main
```

**4. Need to switch branches with uncommitted changes**
```bash
# Save changes temporarily
git stash

# Switch branches
git checkout other-branch

# Return and restore changes
git checkout original-branch
git stash pop
```

---

## 📊 **WORKFLOW FOR CURRENT PROJECT**

### **Immediate Actions (August 24, 2025)**
1. **Merge current work to main:**
   ```bash
   # From backup-24-8-2025-v2 branch
   git add .
   git commit -m "Add payment strategy documentation and roadmap updates"
   
   # Switch to main and merge
   git checkout main
   git merge backup-24-8-2025-v2
   git push origin main
   ```

2. **Future development on main:**
   ```bash
   # Always work on main for daily development
   git checkout main
   git pull origin main
   # Make changes...
   git add .
   git commit -m "descriptive message"
   git push origin main
   ```

### **For Major Features**
Use feature branches for:
- Payment gateway integration
- Major UI overhauls  
- Database migrations
- API integrations

### **For Daily Development**
Use main branch for:
- Bug fixes
- Small feature additions
- Documentation updates
- Configuration changes

---

## 🎯 **BEST PRACTICES SUMMARY**

1. **Always pull before starting work**
2. **Commit frequently with descriptive messages**  
3. **Push at the end of each work session**
4. **Use feature branches for experimental work**
5. **Keep main branch stable and deployable**
6. **Document important changes**
7. **Backup important work with descriptive branch names**

---

## 📅 **MAINTENANCE SCHEDULE**

### **Weekly**
- Review commit history for clarity
- Clean up old feature branches
- Update documentation if needed

### **Monthly**
- Archive old backup branches
- Review branch strategy effectiveness
- Update this guide if workflow changes

---

**Document Control:**
- **Version:** 1.0
- **Next Review Date:** September 24, 2025
- **Update Frequency:** As workflow evolves
- **Approval Required:** Solo Developer