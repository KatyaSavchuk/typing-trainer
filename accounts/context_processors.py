def learning_language(request):
    """
    Добавляет learning_language в контекст всех шаблонов.
    Берём из:
    1) request.user.profile.learning_language (если залогинен)
    2) request.session["learning_language"]
    3) default "uk"
    """
    lang = "uk"

    if request.user.is_authenticated:
        profile = getattr(request.user, "profile", None)
        if profile and getattr(profile, "learning_language", None):
            lang = profile.learning_language
            request.session["learning_language"] = lang
            return {"learning_language": lang}

    lang = request.session.get("learning_language", "uk")
    return {"learning_language": lang}
