"""
URL configuration for fishing_game project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from ninja import NinjaAPI
from ninja_jwt.routers.obtain import obtain_pair_router
from ninja_jwt.routers.verify import verify_router
from ninja_jwt.routers.blacklist import blacklist_router

from apps.users.api import router as users_router
from apps.fishing.api import router as fishing_router
from apps.equipment.api import router as equipment_router
from apps.inventory.api import router as inventory_router
from apps.progression.api import router as progression_router

api = NinjaAPI(
    title='Fishing Game API',
    version='1.0.0',
    description='API для браузерной игры-рыбалки'
)

# JWT Authentication routers
api.add_router('/token/', tags=['auth'], router=obtain_pair_router)
api.add_router('/token/', tags=['auth'], router=verify_router)
api.add_router('/token/', tags=['auth'], router=blacklist_router)

# API routers
api.add_router('/users/', users_router, tags=['users'])
api.add_router('/fishing/', fishing_router, tags=['fishing'])
api.add_router('/equipment/', equipment_router, tags=['equipment'])
api.add_router('/inventory/', inventory_router, tags=['inventory'])
api.add_router('/progression/', progression_router, tags=['progression'])

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # Debug toolbar (опционально)
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        pass
