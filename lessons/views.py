from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.utils import timezone

from .models import Lesson, LessonProgress


def get_learning_language(request) -> str:
    # 1) из сессии
    lang = request.session.get("learning_language")
    if lang in ("uk", "en"):
        return lang

    # 2) из профиля пользователя
    if request.user.is_authenticated and hasattr(request.user, "profile"):
        lang = getattr(request.user.profile, "learning_language", None)
        if lang in ("uk", "en"):
            return lang

    # 3) дефолт
    return "uk"


def lessons_list(request):
    lang = get_learning_language(request)

    lessons = Lesson.objects.filter(language=lang).order_by("order", "id")
    total = lessons.count()

    progress_percent = 0
    completed_count = 0
    last_lesson = None

    if request.user.is_authenticated and total > 0:
        completed_count = LessonProgress.objects.filter(
            user=request.user,
            lesson__language=lang,
            completed=True
        ).count()

        progress_percent = int((completed_count / total) * 100) if total else 0

        last_progress = (
            LessonProgress.objects.filter(user=request.user, lesson__language=lang)
            .select_related("lesson")
            .order_by("-completed_at", "-updated_at", "-id")
            .first()
        )
        if last_progress and last_progress.lesson:
            last_lesson = last_progress.lesson

    ctx = {
        "lessons": lessons,
        "progress_percent": progress_percent,
        "completed_count": completed_count,
        "total_lessons": total,
        "last_lesson": last_lesson,
        "learning_language": lang,
    }
    return render(request, "lessons_list.html", ctx)


def lesson_start(request, lesson_id):
    lang = get_learning_language(request)
    lesson = get_object_or_404(Lesson, id=lesson_id, language=lang)

    # берём текст нужного языка
    first_text = lesson.texts.filter(language=lang).order_by("id").first()

    if first_text:
        lesson_text = first_text.text
    else:
        any_text = lesson.texts.order_by("id").first()
        if any_text:
            lesson_text = any_text.text
        else:
            raw = (lesson.keys_covered or "").strip()
            if not raw:
                keys = ["f", "j"]
            else:
                keys = raw.split() if " " in raw else list(raw)

            lesson_text = (" ".join([(k * 3) for k in keys]) + " ") * 3
            lesson_text = lesson_text.strip()

    return render(request, "lesson_start.html", {
        "lesson": lesson,
        "lesson_text": lesson_text,
        "learning_language": lang,
    })


def lesson_complete(request, lesson_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    lang = get_learning_language(request)
    lesson = get_object_or_404(Lesson, id=lesson_id, language=lang)

    if not request.user.is_authenticated:
        return JsonResponse({"ok": True, "saved": False})

    progress, _ = LessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson
    )

    progress.completed = True
    progress.completed_at = timezone.now()
    progress.save()

    return JsonResponse({"ok": True, "saved": True})
