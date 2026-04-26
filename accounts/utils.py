def get_learning_language(request):
    # 1) сесія (ти вже записуєш туди після save)
    lang = request.session.get("learning_language")
    if lang in ("uk", "en"):
        return lang

    # 2) профіль (для залогінених)
    if request.user.is_authenticated:
        prof = getattr(request.user, "profile", None)
        if prof and prof.learning_language in ("uk", "en"):
            return prof.learning_language

    # 3) дефолт
    return "uk"
