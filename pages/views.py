from django.shortcuts import render, get_object_or_404
import json
import random
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Max

# ✅ модели тренажёра из app "trainer"
from trainer.models import TrainingText, TrainingResult

# ✅ тесты — модели pages
from .models import TestTopic, TestText

UA_WORDS = [
    "космос", "ракета", "планета", "галактика", "астероід", "орбіта",
    "метеор", "комета", "зірка", "швидкість", "пілот", "сигнал",
]

EN_WORDS = [
    "space", "rocket", "planet", "galaxy", "asteroid", "orbit",
    "meteor", "comet", "star", "speed", "pilot", "signal",
]


def space_typing(request):
    lang = request.session.get("learning_language", "uk")  # "uk" или "en"

    words = EN_WORDS if lang == "en" else UA_WORDS

    return render(request, "space_typing.html", {
        "words": words,
        "lang": lang,
    })


# ---------- helper ----------
def get_learning_language(request):
    if request.user.is_authenticated and hasattr(request.user, "profile"):
        lang = getattr(request.user.profile, "learning_language", None)
        if lang in ("uk", "en"):
            return lang
    return request.session.get("learning_language", "uk")


def build_mode_stats(qs):
    attempts = qs[:30]
    last_for_chart = list(qs[:20])[::-1]

    labels = [a.created_at.strftime("%d.%m") for a in last_for_chart]
    wpm_data = [float(a.wpm or 0) for a in last_for_chart]
    acc_data = [float(a.accuracy or 0) for a in last_for_chart]

    summary = qs.aggregate(
        best_wpm=Max("wpm"),
        avg_wpm=Avg("wpm"),
        best_acc=Max("accuracy"),
        avg_acc=Avg("accuracy"),
    )

    return {
        "attempts": attempts,
        "labels": labels,
        "wpm_data": wpm_data,
        "acc_data": acc_data,
        "summary": summary,
    }


# ---------- pages ----------
def games(request):
    return render(request, "games.html")


def home(request):
    return render(request, "home.html")


def login_page(request):
    return render(request, "login.html")


def trainer(request):
    lang = get_learning_language(request)

    texts_qs = TrainingText.objects.filter(language=lang, active=True).order_by("id")

    if texts_qs.exists():
        text_obj = random.choice(list(texts_qs))
        target_text = text_obj.text
    else:
        target_text = (
            "Це приклад тренувального тексту українською мовою для набору."
            if lang == "uk"
            else "This is a sample English typing practice sentence."
        )

    return render(request, "trainer.html", {
        "target_text": target_text,
        "learning_language": lang,
        "duration_sec": 60,
    })


def testing(request, topic_slug=None, text_id=None):
    lang = get_learning_language(request)

    topics = TestTopic.objects.filter(active=True, language=lang).order_by("name")

    selected_topic = None
    topic_texts = TestText.objects.none()
    selected_text = None

    if topic_slug:
        selected_topic = get_object_or_404(
            TestTopic, slug=topic_slug, active=True, language=lang
        )
        topic_texts = TestText.objects.filter(
            topic=selected_topic, active=True
        ).order_by("title")

        if text_id:
            selected_text = get_object_or_404(
                TestText, id=text_id, topic=selected_topic, active=True
            )
        else:
            selected_text = topic_texts.first()

    target_text = selected_text.text if selected_text else ""

    return render(request, "testing.html", {
        "topics": topics,
        "selected_topic": selected_topic,
        "topic_texts": topic_texts,
        "selected_text": selected_text,
        "target_text": target_text,
        "duration_sec": 60,
    })


def profile(request):
    return render(request, "profile.html")


@require_POST
def trainer_save(request):
    data = json.loads(request.body.decode("utf-8"))
    user = request.user if request.user.is_authenticated else None

    res = TrainingResult.objects.create(
        user=user,
        mode="trainer",
        duration_sec=int(data.get("duration_sec", 60)),
        typed_chars=int(data.get("typed_chars", 0)),
        correct_chars=int(data.get("correct_chars", 0)),
        errors=int(data.get("errors", 0)),
        accuracy=float(data.get("accuracy", 0.0)),
        cpm=float(data.get("cpm", 0.0)),
        wpm=float(data.get("wpm", 0.0)),
    )
    return JsonResponse({"ok": True, "id": res.id})


@require_POST
def test_save(request):
    data = json.loads(request.body.decode("utf-8"))
    user = request.user if request.user.is_authenticated else None

    res = TrainingResult.objects.create(
        user=user,
        mode="test",
        duration_sec=int(data.get("duration_sec", 60)),
        typed_chars=int(data.get("typed_chars", 0)),
        correct_chars=int(data.get("correct_chars", 0)),
        errors=int(data.get("errors", 0)),
        accuracy=float(data.get("accuracy", 0.0)),
        cpm=float(data.get("cpm", 0.0)),
        wpm=float(data.get("wpm", 0.0)),
    )
    return JsonResponse({"ok": True, "id": res.id})


def space_race(request):
    lang = request.session.get("learning_language", "uk")

    if lang == "en":
        race_text = "space rockets fly fast through the galaxy and reach the finish line"
    else:
        race_text = "космічні ракети швидко летять крізь галактику до фінішу"

    return render(request, "space_race.html", {
        "race_text": race_text,
        "lang": lang,
    })


@login_required
def stats(request):
    trainer_qs = (
        TrainingResult.objects
        .filter(user=request.user, mode="trainer")
        .order_by("-created_at")
    )

    test_qs = (
        TrainingResult.objects
        .filter(user=request.user, mode="test")
        .order_by("-created_at")
    )

    trainer_stats = build_mode_stats(trainer_qs)
    test_stats = build_mode_stats(test_qs)

    return render(request, "stats.html", {
        "trainer_stats": trainer_stats,
        "test_stats": test_stats,
    })