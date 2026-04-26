from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    path("login/", auth_views.LoginView.as_view(template_name="login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),

    path("", include("accounts.urls")),

    path("", include("pages.urls")),
    path("", include("lessons.urls")),
    path("", include("trainer.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=getattr(settings, "STATIC_ROOT", None))
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
