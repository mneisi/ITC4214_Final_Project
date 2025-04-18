import os
import random
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.conf import settings
from django.core.files import File
from Store.models import Category, SubCategory, Product, ProductImage, ProductSpecification


class Command(BaseCommand):
    help = 'Creates sample products for the SoundSphere store'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating sample categories, products and specifications...')
        
        # Create Categories
        categories = [
            {
                'name': 'Headphones',
                'description': 'High-quality audio headphones for all your listening needs.'
            },
            {
                'name': 'Speakers',
                'description': 'Powerful speakers with crisp sound for your home or studio.'
            },
            {
                'name': 'Microphones',
                'description': 'Professional microphones for recording, streaming, and live performances.'
            },
            {
                'name': 'Audio Interfaces',
                'description': 'Connect your instruments and microphones to your computer.'
            }
        ]
        
        for cat_data in categories:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'slug': slugify(cat_data['name'])
                }
            )
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        # Create Subcategories
        subcategories = [
            # Headphones subcategories
            {
                'category_name': 'Headphones',
                'name': 'Over-ear',
                'description': 'Full-size headphones that completely cover the ear.'
            },
            {
                'category_name': 'Headphones',
                'name': 'In-ear',
                'description': 'Compact earbuds that fit directly in the ear canal.'
            },
            {
                'category_name': 'Headphones',
                'name': 'Wireless',
                'description': 'Bluetooth headphones with no wires.'
            },
            # Speakers subcategories
            {
                'category_name': 'Speakers',
                'name': 'Bookshelf',
                'description': 'Compact speakers ideal for small to medium-sized rooms.'
            },
            {
                'category_name': 'Speakers',
                'name': 'Floor Standing',
                'description': 'Large speakers that deliver powerful sound for larger rooms.'
            },
            {
                'category_name': 'Speakers',
                'name': 'Portable',
                'description': 'Compact, battery-powered speakers for on-the-go use.'
            },
            # Microphones subcategories
            {
                'category_name': 'Microphones',
                'name': 'Condenser',
                'description': 'Sensitive microphones ideal for studio recordings.'
            },
            {
                'category_name': 'Microphones',
                'name': 'Dynamic',
                'description': 'Durable microphones for live performances.'
            },
            {
                'category_name': 'Microphones',
                'name': 'USB',
                'description': 'Plug-and-play microphones that connect directly to your computer.'
            },
            # Audio Interfaces subcategories
            {
                'category_name': 'Audio Interfaces',
                'name': 'Desktop',
                'description': 'Compact interfaces for home studios.'
            },
            {
                'category_name': 'Audio Interfaces',
                'name': 'Rack-mountable',
                'description': 'Professional interfaces for larger studio setups.'
            }
        ]
        
        for subcat_data in subcategories:
            category = Category.objects.get(name=subcat_data['category_name'])
            subcategory, created = SubCategory.objects.get_or_create(
                name=subcat_data['name'],
                category=category,
                defaults={
                    'description': subcat_data['description'],
                    'slug': slugify(subcat_data['name'])
                }
            )
            if created:
                self.stdout.write(f'Created subcategory: {subcategory.name} (under {category.name})')
        
        # Create Products
        products = [
            # Headphones - Over-ear
            {
                'category_name': 'Headphones',
                'subcategory_name': 'Over-ear',
                'name': 'SoundSphere Pro Studio Headphones',
                'brand': 'SoundSphere',
                'sku': 'SS-HP-001',
                'description': 'Professional studio headphones with exceptional sound clarity and comfort for long sessions. These closed-back headphones offer excellent noise isolation and accurate sound reproduction. Perfect for mixing, mastering, and critical listening.',
                'price': 249.99,
                'sale_price': 229.99,
                'stock': 25,
                'color': 'Black',
                'weight': 0.35,
                'dimensions': '8.0 x 4.0 x 9.0 inches',
                'featured': True,
                'bestseller': True,
                'new_arrival': False,
                'warranty': '2-year warranty',
                'specifications': [
                    {'name': 'Driver Size', 'value': '45mm'},
                    {'name': 'Frequency Response', 'value': '15Hz - 22kHz'},
                    {'name': 'Impedance', 'value': '38 ohms'},
                    {'name': 'Sensitivity', 'value': '96dB'},
                    {'name': 'Cable Length', 'value': '3m (detachable)'},
                    {'name': 'Jack Size', 'value': '3.5mm with 6.3mm adapter'}
                ]
            },
            {
                'category_name': 'Headphones',
                'subcategory_name': 'Over-ear',
                'name': 'AudioTech ATH-M50x',
                'brand': 'AudioTech',
                'sku': 'ATH-M50X',
                'description': 'The industry-standard professional studio headphones, loved by audio engineers and music producers worldwide. Featuring proprietary 45mm large-aperture drivers and exceptional sound isolation, these headphones provide an unmatched experience for the most critical audio professionals.',
                'price': 169.99,
                'sale_price': None,
                'stock': 42,
                'color': 'Black',
                'weight': 0.28,
                'dimensions': '7.8 x 4.1 x 8.7 inches',
                'featured': True,
                'bestseller': True,
                'new_arrival': False,
                'warranty': '1-year warranty',
                'specifications': [
                    {'name': 'Driver Size', 'value': '45mm'},
                    {'name': 'Frequency Response', 'value': '15Hz - 28kHz'},
                    {'name': 'Impedance', 'value': '38 ohms'},
                    {'name': 'Sensitivity', 'value': '99dB'},
                    {'name': 'Cable Length', 'value': '1.2m - 3m (detachable)'},
                    {'name': 'Jack Size', 'value': '3.5mm with 6.3mm adapter'}
                ]
            },
            # Headphones - In-ear
            {
                'category_name': 'Headphones',
                'subcategory_name': 'In-ear',
                'name': 'SoundSphere Bass Boost Earbuds',
                'brand': 'SoundSphere',
                'sku': 'SS-EB-001',
                'description': 'Premium in-ear monitors with enhanced bass response and crystal-clear highs. These comfortable earbuds include multiple ear tip sizes for a perfect fit and optimal sound isolation. Ideal for commuting, workouts, or everyday listening.',
                'price': 89.99,
                'sale_price': 79.99,
                'stock': 35,
                'color': 'Black/Red',
                'weight': 0.015,
                'dimensions': '4.5 x 1.5 x 1.0 inches (case)',
                'featured': False,
                'bestseller': False,
                'new_arrival': True,
                'warranty': '1-year warranty',
                'specifications': [
                    {'name': 'Driver Size', 'value': '10mm'},
                    {'name': 'Frequency Response', 'value': '20Hz - 20kHz'},
                    {'name': 'Impedance', 'value': '16 ohms'},
                    {'name': 'Sensitivity', 'value': '102dB'},
                    {'name': 'Cable Length', 'value': '1.2m'},
                    {'name': 'Jack Size', 'value': '3.5mm gold-plated'}
                ]
            },
            # Headphones - Wireless
            {
                'category_name': 'Headphones',
                'subcategory_name': 'Wireless',
                'name': 'SoundSphere Freedom Wireless',
                'brand': 'SoundSphere',
                'sku': 'SS-WH-001',
                'description': 'High-fidelity wireless headphones with active noise cancellation and 30-hour battery life. Experience true freedom with Bluetooth 5.0 connectivity, touch controls, and voice assistant support. These premium headphones deliver exceptional sound quality without the wires.',
                'price': 299.99,
                'sale_price': None,
                'stock': 18,
                'color': 'Silver',
                'weight': 0.25,
                'dimensions': '7.5 x 3.5 x 8.5 inches',
                'featured': True,
                'bestseller': False,
                'new_arrival': True,
                'warranty': '2-year warranty',
                'specifications': [
                    {'name': 'Driver Size', 'value': '40mm'},
                    {'name': 'Frequency Response', 'value': '20Hz - 22kHz'},
                    {'name': 'Battery Life', 'value': '30 hours (ANC on)'},
                    {'name': 'Bluetooth Version', 'value': '5.0'},
                    {'name': 'Charging Time', 'value': '2 hours'},
                    {'name': 'Noise Cancellation', 'value': 'Active (ANC)'}
                ]
            },
            # Speakers - Bookshelf
            {
                'category_name': 'Speakers',
                'subcategory_name': 'Bookshelf',
                'name': 'SoundSphere Compact Monitor Speakers',
                'brand': 'SoundSphere',
                'sku': 'SS-BK-001',
                'description': 'Precision-engineered bookshelf speakers delivering room-filling sound from a compact design. With a 5.25" woofer and 1" silk dome tweeter, these speakers provide accurate sound reproduction for music production, gaming, or home entertainment.',
                'price': 299.99,
                'sale_price': 279.99,
                'stock': 12,
                'color': 'Black Oak',
                'weight': 6.8,
                'dimensions': '11.8 x 7.4 x 9.5 inches (each)',
                'featured': False,
                'bestseller': True,
                'new_arrival': False,
                'warranty': '3-year warranty',
                'specifications': [
                    {'name': 'Power Output', 'value': '100W (pair)'},
                    {'name': 'Frequency Response', 'value': '45Hz - 20kHz'},
                    {'name': 'Woofer Size', 'value': '5.25 inches'},
                    {'name': 'Tweeter Size', 'value': '1 inch silk dome'},
                    {'name': 'Impedance', 'value': '8 ohms'},
                    {'name': 'Sensitivity', 'value': '87dB'}
                ]
            },
            # Speakers - Floor Standing
            {
                'category_name': 'Speakers',
                'subcategory_name': 'Floor Standing',
                'name': 'SoundSphere Tower Series T-800',
                'brand': 'SoundSphere',
                'sku': 'SS-FS-001',
                'description': 'Flagship floor-standing speakers delivering immersive, room-filling sound for audiophiles and home theater enthusiasts. Featuring dual 8" woofers, a 5" midrange driver, and a 1" tweeter in a bass-reflex cabinet design for powerful, detailed audio reproduction.',
                'price': 899.99,
                'sale_price': None,
                'stock': 8,
                'color': 'Walnut',
                'weight': 25.5,
                'dimensions': '43.5 x 11.0 x 15.5 inches (each)',
                'featured': True,
                'bestseller': False,
                'new_arrival': False,
                'warranty': '5-year warranty',
                'specifications': [
                    {'name': 'Power Handling', 'value': '250W RMS, 500W peak'},
                    {'name': 'Frequency Response', 'value': '28Hz - 25kHz'},
                    {'name': 'Woofer Size', 'value': 'Dual 8 inches'},
                    {'name': 'Midrange Size', 'value': '5 inches'},
                    {'name': 'Tweeter Size', 'value': '1 inch titanium dome'},
                    {'name': 'Sensitivity', 'value': '92dB'},
                    {'name': 'Impedance', 'value': '6 ohms'}
                ]
            },
            # Microphones - Condenser
            {
                'category_name': 'Microphones',
                'subcategory_name': 'Condenser',
                'name': 'SoundSphere Studio Pro Condenser',
                'brand': 'SoundSphere',
                'sku': 'SS-MC-001',
                'description': 'Professional large-diaphragm condenser microphone for studio recording. Capture vocals, acoustic instruments, and more with exceptional clarity and detail. Features a cardioid pickup pattern and includes shock mount and pop filter.',
                'price': 199.99,
                'sale_price': 179.99,
                'stock': 15,
                'color': 'Matte Black',
                'weight': 0.45,
                'dimensions': '8.0 x 2.5 x 2.5 inches',
                'featured': False,
                'bestseller': True,
                'new_arrival': False,
                'warranty': '2-year warranty',
                'specifications': [
                    {'name': 'Capsule', 'value': '1-inch gold-sputtered diaphragm'},
                    {'name': 'Polar Pattern', 'value': 'Cardioid'},
                    {'name': 'Frequency Response', 'value': '20Hz - 20kHz'},
                    {'name': 'Sensitivity', 'value': '-34dB (0dB=1V/Pa)'},
                    {'name': 'Max SPL', 'value': '136dB'},
                    {'name': 'Self Noise', 'value': '16dB-A'}
                ]
            },
            # Audio Interfaces - Desktop
            {
                'category_name': 'Audio Interfaces',
                'subcategory_name': 'Desktop',
                'name': 'SoundSphere Connect Pro 2x2',
                'brand': 'SoundSphere',
                'sku': 'SS-AI-001',
                'description': 'Professional 2-input, 2-output USB audio interface for recording and production. Features high-quality preamps with 48V phantom power, direct monitoring, and MIDI I/O. Perfect for home studios, podcasting, and mobile recording.',
                'price': 149.99,
                'sale_price': None,
                'stock': 20,
                'color': 'Black',
                'weight': 0.8,
                'dimensions': '7.2 x 5.5 x 2.0 inches',
                'featured': False,
                'bestseller': False,
                'new_arrival': True,
                'warranty': '2-year warranty',
                'specifications': [
                    {'name': 'Inputs', 'value': '2 combo XLR/TRS'},
                    {'name': 'Outputs', 'value': '2 TRS line outputs, 1 headphone output'},
                    {'name': 'Sample Rate', 'value': 'Up to 192kHz'},
                    {'name': 'Bit Depth', 'value': '24-bit'},
                    {'name': 'Phantom Power', 'value': '+48V'},
                    {'name': 'Connection', 'value': 'USB-C'}
                ]
            },
        ]
        
        # Create products
        for product_data in products:
            category = Category.objects.get(name=product_data['category_name'])
            subcategory = SubCategory.objects.get(name=product_data['subcategory_name'], category=category)
            
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                defaults={
                    'category': category,
                    'subcategory': subcategory,
                    'slug': slugify(product_data['name']),
                    'brand': product_data['brand'],
                    'sku': product_data['sku'],
                    'description': product_data['description'],
                    'price': product_data['price'],
                    'sale_price': product_data['sale_price'],
                    'stock': product_data['stock'],
                    'color': product_data['color'],
                    'weight': product_data['weight'],
                    'dimensions': product_data['dimensions'],
                    'featured': product_data['featured'],
                    'bestseller': product_data['bestseller'],
                    'new_arrival': product_data['new_arrival'],
                    'warranty': product_data['warranty'],
                }
            )
            
            if created:
                self.stdout.write(f'Created product: {product.name}')
                
                # Add specifications
                for spec_data in product_data['specifications']:
                    ProductSpecification.objects.create(
                        product=product,
                        name=spec_data['name'],
                        value=spec_data['value']
                    )
                
                # Add default product image if no images exist
                if not ProductImage.objects.filter(product=product).exists():
                    image_path = f"media/products/default_{slugify(category.name)}.jpg"
                    if os.path.exists(image_path):
                        with open(image_path, 'rb') as f:
                            ProductImage.objects.create(
                                product=product,
                                image=File(f, name=f"product_{product.id}.jpg"),
                                alt_text=product.name,
                                is_main=True
                            )
                            self.stdout.write(f'Added default image for {product.name}')
            
        self.stdout.write(self.style.SUCCESS('Successfully created sample products!')) 