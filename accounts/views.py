from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect

from .forms import RegisterForm, ProfileLanguageForm
from .models import Profile


def register_view(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            Profile.objects.get_or_create(user=user)
            login(request, user)
            return redirect("profile")
    else:
        form = RegisterForm()

    return render(request, "register.html", {"form": form})


@login_required
def profile_view(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    return render(request, "profile.html", {"profile": profile})


@login_required
def profile_settings(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        form = ProfileLanguageForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            request.session["learning_language"] = profile.learning_language
            return redirect("profile_settings")
    else:
        form = ProfileLanguageForm(instance=profile)

    return render(request, "profile_settings.html", {"form": form})
