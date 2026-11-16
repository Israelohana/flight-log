# ✈️ Flight Log — יומן טיסה

אפליקציית Web אישית שמציגה את מסע הלמידה שלי בקורס Flying Solo. כל הנתונים מגיעים מ-Google Sheets.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Radix (בסגנון shadcn/ui) · Lucide · Motion

## מסכים

| מסך | נתיב | מקור הנתונים |
| --- | --- | --- |
| Mission Control | `/` | כל הלשוניות |
| Flight Log | `/log` | לשונית יומן הטיסה |
| My Destinations | `/destinations` | לשונית מטרות הקורס |
| Weekly Debrief | `/debrief` | לשונית סיכום שבועי |

## איך החיבור לגיליון עובד

- החיבור מתבצע בצד השרת בלבד (`lib/sheets.ts`), עם Service Account. שום מפתח לא מגיע לדפדפן.
- הלשוניות מזוהות לפי מילת מפתח בשם: "יומן", "מטרות", "סיכום". אפשר לשנות אימוג'י או ניסוח בלי לשבור את החיבור.
- העמודות מזוהות לפי שם הכותרת (`lib/normalize.ts`). למשל "💡 מה למדתי?" מזוהה כ"מה למדתי". עמודה שלא זוהתה לא נעלמת: היא מוצגת בפירוט המשימה תחת השם שלה.
- הנתונים נשמרים במטמון ל-60 שניות. כפתור הרענון בכותרת מושך אותם מחדש מיד.
- כל עוד החיבור לא מוגדר, האפליקציה מציגה נתוני תצוגה מסומנים (DEMO), ולא מציגה אותם כנתונים אמיתיים.

## הגדרה (פעם אחת, כ-10 דקות)

### 1. יצירת Service Account ב-Google Cloud
1. נכנסים ל-[console.cloud.google.com](https://console.cloud.google.com) ויוצרים פרויקט חדש, למשל `flight-log`.
2. **APIs & Services → Library** → מחפשים **Google Sheets API** → **Enable**.
3. **IAM & Admin → Service Accounts → Create service account**. שם: `flight-log`. אפשר לדלג על שלב ההרשאות.
4. נכנסים ל-Service Account שנוצר → **Keys → Add key → Create new key → JSON**. קובץ JSON יורד למחשב.
5. מעתיקים מהקובץ שני ערכים: `client_email` ו-`private_key`.

### 2. שיתוף הגיליון
בגיליון: **Share** → מדביקים את ה-`client_email` → הרשאת **Editor** → Send.
Editor נדרש כי האפליקציה שומרת משימות חדשות ואבני דרך. לקריאה בלבד מספיק Viewer.

### 3. משתני סביבה
מעתיקים את `.env.example` ל-`.env.local` וממלאים:

```
GOOGLE_SHEET_ID=165HYVQCu1ko2mkqAdDZM5gw9UbNJkeVRjF_vgUSlI9U
GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email>
GOOGLE_PRIVATE_KEY="<private_key, כולל ה-\n>"
COURSE_START=2026-11-09
ENABLE_WRITES=true
WRITE_PASSCODE=<קוד שתבחר>
```

`WRITE_PASSCODE` נשאל פעם אחת בכל מכשיר לפני שמירה. בלעדיו השמירה כבויה, כי אחרת כל מי שיש לו את הקישור יוכל לכתוב לגיליון.

### 4. הרצה מקומית
```
npm install
npm run dev
```
פותחים את http://localhost:3000. בכותרת אמור להופיע **LIVE**.

### 5. העלאה ל-Vercel
1. מעלים את התיקייה ל-repo ב-GitHub.
2. ב-[vercel.com/new](https://vercel.com/new) → Import את ה-repo. Vercel מזהה Next.js לבד.
3. **Settings → Environment Variables** → מוסיפים את ארבעת המשתנים מסעיף 3. את `GOOGLE_PRIVATE_KEY` מדביקים כמו שהוא, עם ה-`\n`.
4. Deploy.

## שמירה מתוך האפליקציה
- **משימה חדשה:** הטופס מוסיף שורה ללשונית היומן. כל שדה נכתב מתחת לכותרת המתאימה לפי שם, והתאריך והשבוע מתמלאים אוטומטית.
- **אבני דרך:** עמודה "אבני דרך" בלשונית המטרות, אחת בכל שורה בתא. ✓ בתחילת השורה מסמן שהושלמה. לחיצה באפליקציה מסמנת ושומרת.
- **פרטיות:** הקריאה פתוחה לכל מי שיש לו את הקישור. כדי להסתיר את היומן, מפעילים ב-Vercel את **Settings → Deployment Protection**.

## שלב הבא
- עריכת משימה קיימת מתוך האפליקציה.
- טיוטת תחקיר שבועי מ-AI: נקודת ההרחבה היא כרטיס "COMING NEXT" במסך התחקיר.

## מבנה
```
app/            מסכים, server action לרענון, API route
components/     shell, flight-route (Hero), boarding-pass, log-explorer, ui
lib/sheets.ts   חיבור Google Sheets: קריאה, הוספת שורה, עדכון אבני דרך (צד שרת)
app/actions.ts  שמירה עם קוד גישה, רענון
lib/normalize.ts  זיהוי כותרות, סטטוסים, תאריכים ושבועות
lib/data.ts     טעינה, מטמון ומצבי demo/שגיאה
lib/demo.ts     נתוני תצוגה מסומנים
```
