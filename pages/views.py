from django.shortcuts import render, get_object_or_404
import json
import random
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Max

from trainer.models import TrainingText, TrainingResult
from .models import TestTopic, TestText


UA_WORDS = [
    "космос", "ракета", "планета", "галактика", "астероїд", "орбіта",
    "метеор", "комета", "зірка", "швидкість", "пілот", "сигнал",
    "місяць", "сонце", "земля", "марс", "венера", "сатурн",
    "юпітер", "нептун", "уран", "всесвіт", "простір", "небо",
    "політ", "запуск", "двигун", "паливо", "корабель", "капсула",
    "шатл", "станція", "модуль", "екіпаж", "скафандр", "шолом",
    "радар", "сенсор", "лазер", "промінь", "телескоп", "місія",
    "подорож", "посадка", "гравітація", "кисень", "супутник", "робот",
    "дрон", "портал", "щит", "енергія", "потужність", "система",
    "команда", "ціль", "небезпека", "туманність", "затемнення", "горизонт",
    "кратер", "камінь", "пил", "вибух", "іскра", "полумя",
    "вогонь", "слід", "буря", "хвиля", "імпульс", "ядро",
    "метал", "лід", "тінь", "сяйво", "темрява", "світло",
    "швидкий", "повільний", "сміливий", "розумний", "чіткий", "гострий",
    "старт", "фініш", "перемога", "поразка", "рівень", "рахунок",
    "увага", "реакція", "точність", "помилка", "тренування", "клавіатура",
    "літера", "символ", "слово", "гравець", "гра", "бонус",
    "результат", "рекорд", "навичка", "завдання", "виклик", "практика",
    "шлях", "маршрут", "курс", "вектор", "вісь", "кут",
    "відстань", "поверхня", "атмосфера", "тиск", "температура", "радіація",
    "магніт", "компас", "навігація", "екран", "монітор",
    "мережа", "повідомлення", "попередження", "тривога", "батарея",
    "резерв", "ремонт", "пошкодження", "частота", "канал", "передача",
    "приймач", "сектор", "база", "колонія", "лабораторія", "ангар",
    "вантаж", "місток", "вікно", "камера", "інженер", "капітан",
    "штурман", "науковець", "дослід", "експедиція", "траєкторія", "орієнтир"
]

EN_WORDS = [
    "space", "rocket", "planet", "galaxy", "asteroid", "orbit",
    "meteor", "comet", "star", "speed", "pilot", "signal",
    "moon", "sun", "earth", "mars", "venus", "saturn",
    "jupiter", "neptune", "uranus", "cosmos", "universe", "sky",
    "flight", "launch", "engine", "fuel", "ship", "capsule",
    "shuttle", "station", "module", "crew", "suit", "helmet",
    "radar", "sensor", "laser", "beam", "telescope", "mission",
    "journey", "travel", "landing", "gravity", "oxygen", "satellite",
    "robot", "drone", "portal", "shield", "energy", "power",
    "system", "command", "target", "danger", "nebula", "eclipse",
    "horizon", "crater", "stone", "dust", "blast", "spark",
    "flame", "fire", "trail", "storm", "wave", "pulse",
    "core", "metal", "ice", "shadow", "glow", "dark",
    "light", "fast", "slow", "brave", "smart", "clear",
    "sharp", "start", "finish", "victory", "defeat", "level",
    "score", "focus", "reaction", "accuracy", "mistake", "training",
    "keyboard", "letter", "symbol", "word", "player", "game",
    "bonus", "result", "record", "skill", "task", "challenge",
    "practice", "path", "route", "course", "vector", "axis",
    "angle", "distance", "surface", "atmosphere", "pressure", "temperature",
    "radiation", "magnet", "compass", "navigation", "computer", "display",
    "monitor", "network", "connection", "message", "warning", "alert",
    "battery", "backup", "repair", "damage", "frequency", "channel",
    "transmit", "receiver", "sector", "base", "colony", "laboratory",
    "hangar", "cargo", "bridge", "window", "camera", "engineer",
    "captain", "navigator", "scientist", "explore", "expedition", "trajectory"
]


UA_RACE_TEXTS = [
    "Швидкий і точний набір тексту допомагає обігнати суперників у космічній гонці та першим дістатися фінішу",
    "Космічні ракети летять до фінішу через темний зоряний простір а гравець має уважно вводити кожен символ",
    "Гравець уважно вводить текст без помилок щоб його ракета впевнено рухалась вперед і не втрачала швидкість",
    "Кожна правильно введена літера наближає корабель до перемоги та допомагає залишити суперників позаду",
    "У цій грі важливо друкувати рівно уважно і без помилок бо ракети суперників постійно рухаються вперед",
    "Ракети суперників не зупиняються тому гравцю потрібно швидко набирати текст і стежити за точністю кожного символу",
    "Космічна траса довга але точний і спокійний набір допомагає дістатися фінішу раніше за інших учасників",
    "Перемога у гонці залежить від швидкості реакції уважності гравця та вміння не робити зайвих помилок під час друку",
    "Щоб перемогти у космічній гонці потрібно вводити текст послідовно швидко і точно не відволікаючись від завдання",
    "Ракета гравця рухається вперед після кожної правильно введеної літери тому уважність напряму впливає на результат"
]

EN_RACE_TEXTS = [
    "Fast and accurate typing helps you overtake opponents in the space race and reach the finish line first",
    "Space rockets fly to the finish line through the dark starry sky while the player types every symbol carefully",
    "The player types the text without mistakes so the rocket can move forward confidently and keep its speed",
    "Every correctly typed letter brings the ship closer to victory and helps leave the opponents behind",
    "In this game it is important to type smoothly carefully and without mistakes because opponent rockets keep moving forward",
    "Opponent rockets do not stop so the player needs to type quickly and watch the accuracy of every symbol",
    "The space track is long but calm and accurate typing helps you reach the finish earlier than other racers",
    "Victory in the race depends on reaction speed player attention and the ability to avoid unnecessary typing mistakes",
    "To win the space race you need to type the text consistently quickly and accurately without losing focus",
    "The player rocket moves forward after every correctly typed letter so attention directly affects the final result"
]


def get_learning_language(request):
    if request.user.is_authenticated and hasattr(request.user, "profile"):
        lang = getattr(request.user.profile, "learning_language", None)
        if lang in ("uk", "en"):
            return lang

    return request.session.get("learning_language", "uk")


def space_typing(request):
    lang = get_learning_language(request)

    words = EN_WORDS if lang == "en" else UA_WORDS

    return render(request, "space_typing.html", {
        "words": words,
        "lang": lang,
    })


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
            topic=selected_topic,
            active=True
        ).order_by("title")

        if text_id:
            selected_text = get_object_or_404(
                TestText,
                id=text_id,
                topic=selected_topic,
                active=True
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
    lang = get_learning_language(request)

    if lang == "en":
        race_text = random.choice(EN_RACE_TEXTS)
    else:
        race_text = random.choice(UA_RACE_TEXTS)

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