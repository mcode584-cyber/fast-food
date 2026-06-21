from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FoodItemViewSet, OrderViewSet, VerifyAdminCodeView

router = DefaultRouter()
router.register(r'foods', FoodItemViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('verify-code/', VerifyAdminCodeView.as_view(), name='verify_code'),
]
