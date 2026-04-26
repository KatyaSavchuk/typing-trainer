from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register_view, name="register"),
    path("profile/", views.profile_view, name="profile"),
    path("profile/settings/", views.profile_settings, name="profile_settings"),
]
