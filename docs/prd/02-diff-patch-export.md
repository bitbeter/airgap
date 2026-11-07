# PRD ۲ — خروجی patch یکپارچه از diff

## هدف
کاربر بتواند نتیجهٔ مقایسه را به‌صورت unified diff کپی یا دانلود کند تا در Git، code review یا پیام‌رسان استفاده شود.

## دامنه
1. در کارت نتیجه: «کپی patch» (با `CopyButton` مشترک) و «دانلود ‎.patch».
2. نام فایل‌ها در سربرگ patch قابل ویرایش با پیش‌فرض `a/original.txt` و `b/new.txt`.
3. تعداد خطوط context پیش‌فرض ۳ (هم‌خوان با Git).
4. پایان‌خط‌ها و نبودن newline انتهایی دقیقاً حفظ شوند (`\ No newline at end of file`).

## خارج از دامنه
اعمال patch (apply)، خواندن patch به‌عنوان ورودی، چند فایل.

## نیازمندی‌ها
- ساخت patch با jsdiff (`createTwoFilesPatch` یا `structuredPatch` + قالب‌بندی)، نه الگوریتم دست‌نویس.
- ساخت patch در worker همراه با مقایسه یا در worker جدا؛ برای متن‌های کوچک هم مسیر یکسان باشد.
- دانلود با `Blob` و `URL.createObjectURL`، و `revokeObjectURL` بعد از کلیک. نوع `text/x-diff;charset=utf-8`.
- اگر متن‌ها یکسان‌اند، دکمه‌ها غیرفعال با توضیح.

## داده و ذخیره‌سازی
بدون تغییر. schema تاریخچه دست نمی‌خورد.

## پیاده‌سازی و فایل‌ها
- `lib/patch.mjs` + `patch.d.mts`
- `diff.worker.ts`: پاسخ شامل `patch` شود یا پیام جدا داشته باشد.
- `components/diff-result.tsx`

## معیار پذیرش
- خروجی برای fixtureهای تست با `git diff --no-index --diff-algorithm=myers --no-indent-heuristic` (بعد از نرمال‌کردن سربرگ‌ها و خط `index`) برابر است، یا تفاوت‌های مستند در README توضیح داده شده.
- `git apply --check` روی patch تولیدشده برای fixtureها موفق است.
- متن فارسی، ZWNJ، CRLF و نبودن newline پایانی درست حفظ می‌شوند.

## تست
`tests/patch.test.mjs` در کنار `git-compatibility.test.mjs`؛ اجرای `git apply` روی پوشهٔ موقت.

## پرامپت پیشنهادی
> طبق AGENTS.md و docs/prd/02-diff-patch-export.md، کپی و دانلود unified patch را به src/features/text-diff اضافه کن. از jsdiff استفاده کن، کار را در worker نگه دار و تست سازگاری با git apply بنویس.
