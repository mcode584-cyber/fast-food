from rest_framework import serializers
from .models import FoodItem, Order

class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
   
    items = serializers.JSONField()

    class Meta:
        model = Order
        fields = ['id', 'order_id', 'table', 'items', 'total', 'status', 'created_at']
        extra_kwargs = {
            'order_id': {'required': False, 'allow_null': True},
            'status': {'required': False}
        }