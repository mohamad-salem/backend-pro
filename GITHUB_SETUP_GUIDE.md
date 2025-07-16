# دليل حل مشكلة رفع المشروع على GitHub

## المشكلة الحالية
```
remote: Permission to Prootech-team/backendd.git denied to mohamad-salem.
fatal: unable to access 'https://github.com/Prootech-team/backendd.git/': The requested URL returned error: 403
```

## الحلول المتاحة

### الحل الأول: إضافة المستخدم إلى Organization

**يجب على مالك Prootech-team organization:**

1. **الذهاب إلى GitHub Organization:**
   - https://github.com/Prootech-team

2. **إضافة المستخدم mohamad-salem:**
   - Settings > Members > Invite member
   - أدخل: `mohamad-salem`
   - اختر الصلاحيات المناسبة (Write أو Admin)

3. **قبول الدعوة:**
   - المستخدم mohamad-salem سيتلقى دعوة
   - يجب قبولها من GitHub notifications

### الحل الثاني: استخدام Personal Access Token

1. **إنشاء Personal Access Token:**
   - اذهب إلى: https://github.com/settings/tokens
   - Generate new token (classic)
   - ��ختر الصلاحيات: `repo`, `workflow`
   - انسخ الـ token (سيظهر مرة واحدة فقط)

2. **تحديث remote URL:**
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/Prootech-team/backendd.git
```

3. **رفع المشروع:**
```bash
git push -u origin main
```

### الحل الثالث: إنشاء Repository جديد

إذا لم تتمكن من الوصول إلى Prootech-team:

1. **إنشاء repository جديد:**
   - اذهب إلى: https://github.com/new
   - اسم الـ repo: `prootech-backend` أو `backendd`
   - اختر Public أو Private

2. **تحديث remote URL:**
```bash
git remote set-url origin https://github.com/mohamad-salem/prootech-backend.git
```

3. **رفع المشروع:**
```bash
git push -u origin main
```

### الحل الرابع: استخدام SSH (الأكثر أماناً)

1. **إنشاء SSH Key:**
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

2. **إضافة SSH Key إلى GitHub:**
   - انسخ محتوى: `~/.ssh/id_ed25519.pub`
   - اذهب إلى: https://github.com/settings/keys
   - أضف SSH key جديد

3. **تحديث remote URL:**
```bash
git remote set-url origin git@github.com:Prootech-team/backendd.git
```

4. **رفع المشروع:**
```bash
git push -u origin main
```

## الخطوات الحالية المطلوبة

### إذا كان لديك صلاحية على Prootech-team:

```bash
# استخدم Personal Access Token
git remote set-url origin https://YOUR_TOKEN@github.com/Prootech-team/backendd.git
git push -u origin main
```

### إذا لم تكن لديك صلاحية:

```bash
# أنشئ repository جديد وحدث الـ URL
git remote set-url origin https://github.com/YOUR_USERNAME/backendd.git
git push -u origin main
```

## التحقق من الحالة الحالية

```bash
# التحقق من remote URL
git remote -v

# التحقق من branch
git branch

# التحقق من commits
git log --oneline
```

## نصائح إضافية

### لحفظ credentials:
```bash
git config --global credential.helper store
```

### لتجنب مشاكل line endings على Windows:
```bash
git config --global core.autocrlf true
```

### للتحقق من Git configuration:
```bash
git config --list
```

## بعد حل المشكلة

بمجرد رفع المشروع بنجاح على GitHub، يمكنك:

1. **ربطه مع Vercel:**
   - اذهب إلى vercel.com
   - Import من GitHub
   - اختر الـ repository

2. **إعداد Environment Variables في Vercel**

3. **اختبار الـ API**

---

**ملاحظة:** تأكد من عدم رفع ملف `.env` الذي ��حتوي على معلومات حساسة. الملف محمي بواسطة `.gitignore`.