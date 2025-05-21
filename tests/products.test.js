/**
 * @jest-environment jsdom
 */

// Mock Mustache
jest.mock('mustache');

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

        // Mock Mustache globally
        global.Mustache = require('mustache');
        
        // Import products.js after DOM setup
        require('../products.js');
    });

    test('products array contains correct number of products', () => {
        expect(ProductCard.products).toHaveLength(6);
    });

    test('products have required properties', () => {
        ProductCard.products.forEach(product => {
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('image');
        });
    });

    test('addToCart dispatches custom event with correct product', () => {
        const mockDispatchEvent = jest.spyOn(document, 'dispatchEvent');
        
        ProductCard.addToCart('1');

        expect(mockDispatchEvent).toHaveBeenCalled();
        const eventArg = mockDispatchEvent.mock.calls[0][0];
        expect(eventArg.type).toBe('cart:add');
        expect(eventArg.detail.product.id).toBe('1');
    });

    test('addToCart handles non-existent product ID', () => {
        const consoleSpy = jest.spyOn(console, 'error');
        
        ProductCard.addToCart('999');

        expect(consoleSpy).toHaveBeenCalledWith('Product with ID 999 not found');
    });

    test('start function renders products using Mustache', () => {
        start();
        
        expect(Mustache.render).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                products: ProductCard.products
            })
        );
    });
}); 