"""
Users API endpoints.
"""
from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth
from django.contrib.auth import get_user_model

router = Router()
User = get_user_model()


class UserProfileSchema(Schema):
    id: int
    username: str
    email: str
    level: int
    experience: int
    money: int
    total_fish_caught: int
    biggest_fish_weight: float
    experience_for_next_level: int


class RegisterSchema(Schema):
    username: str
    email: str
    password: str


class MessageSchema(Schema):
    message: str


@router.post('/register', response={201: MessageSchema, 400: MessageSchema})
def register(request, data: RegisterSchema):
    """Register new user."""
    if User.objects.filter(username=data.username).exists():
        return 400, {'message': 'Пользователь с таким именем уже существует'}
    if User.objects.filter(email=data.email).exists():
        return 400, {'message': 'Пользователь с таким email уже существует'}

    user = User.objects.create_user(
        username=data.username,
        email=data.email,
        password=data.password
    )
    # Create player profile
    from apps.users.models import PlayerProfile
    PlayerProfile.objects.create(user=user)

    return 201, {'message': 'Регистрация успешна'}


@router.get('/me', response=UserProfileSchema, auth=JWTAuth())
def get_profile(request):
    """Get current user profile."""
    user = request.auth
    profile = user.profile
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'level': profile.level,
        'experience': profile.experience,
        'money': profile.money,
        'total_fish_caught': profile.total_fish_caught,
        'biggest_fish_weight': profile.biggest_fish_weight,
        'experience_for_next_level': profile.experience_for_next_level,
    }
