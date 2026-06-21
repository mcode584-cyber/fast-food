# menu_api/views.py
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
import random

from menu_api.models import FoodItem, Order
from menu_api.serializers import FoodItemSerializer, OrderSerializer

class FoodItemViewSet(viewsets.ModelViewSet):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer

class OrderViewSet(viewsets.ModelViewSet):
    # استخدام الترتيب المباشر بالأحدث وحماية الاستعلام
    queryset = Order.objects.all().order_by('-id')
    serializer_class = OrderSerializer
    pagination_class = None  # 👈 تعطيل الترقيم هنا تماماً لضمان عدم حدوث خطأ 500 مع الـ GET

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if 'order_id' not in data or not data['order_id']:
            data['order_id'] = f"#{random.randint(1000, 9999)}"
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SystemSettings

class VerifyAdminCodeView(APIView):
    def post(self, request, *args, **kwargs):
      
        input_code = request.data.get('code')
        
        if not input_code:
            return Response({"error": "Code field is required"}, status=status.HTTP_400_BAD_REQUEST)
        
       
        settings, created = SystemSettings.objects.get_or_create(id=1)
        
       
        if input_code == settings.admin_code:
            return Response({"authenticated": True, "message": "Access Granted"}, status=status.HTTP_200_OK)
        else:
            return Response({"authenticated": False, "error": "Invalid security code!"}, status=status.HTTP_401_UNAUTHORIZED)    