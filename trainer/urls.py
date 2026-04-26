from django.urls import path
from . import views

urlpatterns = [
    path("trainer/", views.trainer_view, name="trainer"),
    path("trainer/save/", views.trainer_save, name="trainer_save"),
]
