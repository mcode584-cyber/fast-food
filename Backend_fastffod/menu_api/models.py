from django.db import models

class FoodItem(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, default='Burgers') 
    price = models.DecimalField(max_digits=6, decimal_places=2)
    cal = models.CharField(max_length=50, default="350 cal", blank=True, null=True)
    desc = models.TextField(blank=True, null=True)
    tag = models.CharField(max_length=50, blank=True, null=True) 
    available = models.BooleanField(default=True)
    image = models.TextField(blank=True, null=True) 

    def __str__(self):
        return self.name

class Order(models.Model):
    order_id = models.CharField(max_length=50, blank=True, null=True) 
    table = models.CharField(max_length=500) 
    items = models.JSONField() 
    total = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, default='New') 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - Table {self.table}"
class SystemSettings(models.Model):
    admin_code = models.CharField(max_length=20, default="1234")

    def __str__(self):
        return "System Settings"