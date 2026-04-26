import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import TrainingResult

SAMPLE_TEXT = "fjdk slfj djfk fjdk slfj djfk fjdk slfj"

def trainer_view(request):
    # позже сделаем выбор текста/уровня
    return render(request, "trainer.html", {"target_text": SAMPLE_TEXT})

@require_POST
def trainer_save(request):
    # ждём JSON от фронта
    data = json.loads(request.body.decode("utf-8"))

    user = request.user if request.user.is_authenticated else None

    res = TrainingResult.objects.create(
        user=user,
        mode="trainer",
        duration_sec=int(data.get("duration_sec", 0)),
        typed_chars=int(data.get("typed_chars", 0)),
        correct_chars=int(data.get("correct_chars", 0)),
        errors=int(data.get("errors", 0)),
        accuracy=float(data.get("accuracy", 0.0)),
        cpm=float(data.get("cpm", 0.0)),
        wpm=float(data.get("wpm", 0.0)),
    )

    return JsonResponse({"ok": True, "id": res.id})

TEST_TEXT = (
    "fjdk slfj djfk fjdk slfj djfk fjdk slfj djfk fjdk "
    "asdf jklf asdf jklf fjdk slfj djfk fjdk slfj djfk "
    "practice makes progress practice makes progress "
)

def test_view(request):
    # можно потом дать выбор времени 30/60/120
    return render(request, "test.html", {"target_text": TEST_TEXT, "duration_sec": 60})

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