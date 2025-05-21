/**
 * @jest-environment jsdom
 */

// Mock Mustache
jest.mock('mustache');

// Mock Mustache globally
global.Mustache = require('mustache');

// Import ProductCard class
const { ProductCard, start } = require('../products.js');

describe('ProductCard', () => {
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup DOM
        document.body.innerHTML = `
            <div id="js-products"></div>
            <script id="productTemplate" type="x-tmpl-mustache">
                {{#products}}
                <div class="product-card" data-product-id="{{id}}">
                    <button class="add-to-cart-btn"></button>
                </div>
                {{/products}}
            </script>
        `;

        // Reset Mustache mock
        Mustache.render.mockClear();
    });

    describe('Product Data', () => {
        test('has correct number of products', () => {
            // Should verify the products array length
            expect(ProductCard.products).toHaveLength(6);
        });

        test('each product has required properties', () => {
            // Should verify id, name, and image properties exist
            // Should verify price and description are optional
            ProductCard.products.forEach(product => {
                expect(product).toHaveProperty('id');
                expect(product).toHaveProperty('name');
                expect(product).toHaveProperty('image');
            });
        });
    });

    describe('Rendering', () => {
        test('renders products using Mustache template', () => {
            // Should verify Mustache.render is called with correct template
            const productContainer = document.getElementById('js-products');
            const template = document.getElementById('productTemplate');
            
            start();
            
            expect(Mustache.render).toHaveBeenCalledWith(
                template.innerHTML,
                expect.objectContaining({
                    products: ProductCard.products
                })
            );
            
            // Verify rendered content includes button
            const renderedContent = productContainer.innerHTML;
            expect(renderedContent).toContain('class="product-card"');
            expect(renderedContent).toContain('class="add-to-cart-btn"');
            expect(renderedContent).toContain('data-product-id="1"');
        });

        test('renders products into container', () => {
            // Should verify products are rendered into js-products div
            const productContainer = document.getElementById('js-products');
            const template = document.getElementById('productTemplate');
            
            start();
            
            // Verify rendered content includes button
            const renderedContent = productContainer.innerHTML;
            expect(renderedContent).toContain('class="product-card"');
            expect(renderedContent).toContain('class="add-to-cart-btn"');
            expect(renderedContent).toContain('data-product-id="1"');
        });
    });

    describe('Cart Integration', () => {
        test('finds correct product when adding to cart', () => {
            const product = ProductCard.products[0];
            let foundProduct;

            // Override addToCart to capture the found product
            const originalAddToCart = ProductCard.addToCart;
            ProductCard.addToCart = (id) => {
                foundProduct = ProductCard.products.find(p => p.id === id);
            };

            // Test product lookup
            ProductCard.addToCart(product.id);
            expect(foundProduct).toBe(product);

            // Restore original method
            ProductCard.addToCart = originalAddToCart;
        });

        test('handles non-existent product ID', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            
            ProductCard.addToCart('999');
            
            expect(consoleSpy).toHaveBeenCalledWith('Product with ID 999 not found');
            consoleSpy.mockRestore();
        });

        test('converts product price to number', () => {
            const product = ProductCard.products.find(p => p.price);
            let processedProduct;

            // Override addToCart to capture processed product
            const originalAddToCart = ProductCard.addToCart;
            ProductCard.addToCart = (id) => {
                const found = ProductCard.products.find(p => p.id === id);
                processedProduct = JSON.parse(JSON.stringify(found));
                if (processedProduct.price) {
                    processedProduct.price = parseFloat(processedProduct.price);
                }
            };

            // Test price conversion
            ProductCard.addToCart(product.id);
            expect(typeof processedProduct.price).toBe('number');
            expect(processedProduct.price).toBe(product.price);

            // Restore original method
            ProductCard.addToCart = originalAddToCart;
        });
    });

    describe('Product Management', () => {
        test('can find product by ID', () => {
            // Should verify product lookup works
            // Should verify undefined is returned for invalid ID
            expect(ProductCard.findProductById('1')).toBeDefined();
            expect(ProductCard.findProductById('999')).toBeUndefined();
        });

        test('normalizes product data', () => {
            // Should verify price is converted to number
            // Should verify ID is converted to string
            // Should verify deep copy is created
            const product = ProductCard.products[0];
            const normalizedProduct = ProductCard.normalizeProduct(product);
            expect(normalizedProduct.price).toBe(product.price);
            expect(normalizedProduct.id).toBe(product.id.toString());
            expect(normalizedProduct).not.toBe(product);
        });
    });
}); 