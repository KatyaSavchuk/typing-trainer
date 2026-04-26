from django import forms
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

from .models import Profile


class RegisterForm(forms.ModelForm):
    password1 = forms.CharField(
        label="Пароль",
        widget=forms.PasswordInput(attrs={"placeholder": "Мінімум 8 символів"})
    )
    password2 = forms.CharField(
        label="Повторіть пароль",
        widget=forms.PasswordInput(attrs={"placeholder": "Ще раз пароль"})
    )

    class Meta:
        model = User
        fields = ["username", "email"]
        widgets = {
            "username": forms.TextInput(attrs={"placeholder": "Наприклад: kristina"}),
            "email": forms.EmailInput(attrs={"placeholder": "name@gmail.com"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        for name, field in self.fields.items():
            css = field.widget.attrs.get("class", "")
            if "reg-input" not in css:
                field.widget.attrs["class"] = (css + " reg-input").strip()

        
            if name in ["password1", "password2"]:
                field.widget.attrs.setdefault("autocomplete", "new-password")
            else:
                field.widget.attrs.setdefault("autocomplete", "off")

    def clean_email(self):
        email = (self.cleaned_data.get("email") or "").strip()
        if email and User.objects.filter(email=email).exists():
            raise ValidationError("Такий email вже використовується.")
        return email

    def clean(self):
        cleaned = super().clean()
        p1 = cleaned.get("password1")
        p2 = cleaned.get("password2")
        if p1 and p2 and p1 != p2:
            self.add_error("password2", "Паролі не співпадають.")
        return cleaned

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])  
        if commit:
            user.save()
        return user


class ProfileLanguageForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ["learning_language"]
        labels = {"learning_language": "Мова навчання"}
        widgets = {"learning_language": forms.Select(attrs={"class": "reg-input"})}
