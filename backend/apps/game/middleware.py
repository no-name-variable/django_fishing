"""
Middleware для WebSocket аутентификации через JWT.
"""
from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
import jwt
from django.conf import settings

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token: str):
    """Получить пользователя из JWT токена."""
    try:
        # Декодируем токен
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=['HS256']
        )
        user_id = payload.get('user_id')
        if user_id:
            return User.objects.get(pk=user_id)
    except (jwt.InvalidTokenError, User.DoesNotExist):
        pass
    return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware для аутентификации WebSocket через JWT токен из query string.

    Ожидает токен в формате: ws://host/ws/game/?token=<jwt_token>
    """

    async def __call__(self, scope, receive, send):
        # Получаем query string
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)

        # Извлекаем токен
        token = query_params.get('token', [None])[0]

        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
