from django.contrib import admin
from .models import Category, SubCategory, Product, ProductImage, ProductSpecification, Review

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    extra = 1

class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    readonly_fields = ('user', 'rating', 'comment', 'created_at')
    can_delete = False

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'slug')
    list_filter = ('category',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'category__name')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'subcategory', 'price', 'availability', 'stock', 'featured')
    list_filter = ('category', 'subcategory', 'availability', 'featured', 'bestseller', 'new_arrival')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description', 'sku', 'brand')
    inlines = [ProductImageInline, ProductSpecificationInline, ReviewInline]
    list_editable = ('price', 'availability', 'stock', 'featured')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'category', 'subcategory', 'brand', 'sku', 'description')
        }),
        ('Pricing', {
            'fields': ('price', 'sale_price')
        }),
        ('Inventory', {
            'fields': ('availability', 'stock')
        }),
        ('Details', {
            'fields': ('color', 'weight', 'dimensions', 'warranty')
        }),
        ('Display Options', {
            'fields': ('featured', 'bestseller', 'new_arrival')
        }),
    )

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'alt_text', 'is_main')
    list_filter = ('is_main',)
    search_fields = ('product__name', 'alt_text')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user__username', 'comment')
    readonly_fields = ('created_at',)
