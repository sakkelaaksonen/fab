/**
 * @fileoverview BDD-style tests for ShoppingCart user flows
 * @description Tests cart functionality using behavior-driven development approach
 */

// Add polyfills for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const { ShoppingCart } = require('../cart.js');

// Test data factories
const TestDataFactory = {
    createProduct: (overrides = {}) => ({
        id: 'test-product-1',
        name: 'Test Art Print',
        price: 29.99,
        image: 'test-art.jpg',
        ...overrides
    }),

    createValidCustomerData: () => ({
        name: 'John Doe',
        email: 'john@example.com',
        street: 'Main Street 123',
        city: 'Amsterdam',
        postal: '1234AB',
        country: 'NL',
        acceptedTos: true
    }),

    createOrderData: (overrides = {}) => ({
        customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: {
                street: 'Main Street 123',
                city: 'Amsterdam',
                postal: '1234AB',
                country: 'NL'
            }
        },
        items: [],
        total: 0,
        timestamp: new Date().toISOString(),
        ...overrides
    })
};

// Helper functions for common actions
const CartActions = {
    fillValidForm: (cart) => {
        const data = TestDataFactory.createValidCustomerData();
        if (cart.elements.nameField) cart.elements.nameField.value = data.name;
        if (cart.elements.emailField) cart.elements.emailField.value = data.email;
        if (cart.elements.streetField) cart.elements.streetField.value = data.street;
        if (cart.elements.cityField) cart.elements.cityField.value = data.city;
        if (cart.elements.postalField) cart.elements.postalField.value = data.postal;
        if (cart.elements.countryField) cart.elements.countryField.value = data.country;
        if (cart.elements.tosField) cart.elements.tosField.checked = data.acceptedTos;
    },

    addProductToCart: (cart, product = null) => {
        const testProduct = product || TestDataFactory.createProduct();
        cart.addItem(testProduct);
        return testProduct;
    }
};

// Create a mock DOM environment
const createMockDOM = () => {
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test</title>
        </head>
        <body>
            <!-- Cart Panel -->
            <div id="cart-panel" class="translate-x-full"></div>
            
            <!-- Cart Buttons -->
            <button id="cart-button">Cart</button>
            <button id="cart-button-mobile">Cart</button>
            <button id="close-cart">Close</button>
            <button id="clear-cart">Clear</button>
            
            <!-- Cart Display -->
            <span id="cart-count">0</span>
            <span id="cart-count-mobile">0</span>
            <div id="cart-items"></div>
            <div id="cart-total">€0.00</div>
            
            <!-- Cart Template - Make sure this exists -->
            <script id="cartItemTemplate" type="text/template">
{{#items}}
<div class="cart-item" data-id="{{id}}">
    <img src="{{image}}" alt="{{name}}">
    <div>
        <h3>{{name}}</h3>
        <p>€{{price}}</p>
        <p>Quantity: {{quantity}}</p>
        <p>Total: €{{total}}</p>
    </div>
    <button onclick="cart.removeItem('{{id}}')">Remove</button>
</div>
{{/items}}
            </script>
            
            <!-- Checkout Form -->
            <form id="checkout-form">
                <input id="cart-customer-name" type="text" required minlength="2">
                <input id="cart-customer-email" type="email" required>
                <input id="cart-address-street" type="text" required minlength="5">
                <input id="cart-address-city" type="text" required minlength="2">
                <input id="cart-address-postal" type="text" required minlength="4">
                <select id="cart-address-country" required>
                    <option value="">Select Country</option>
                    <option value="NL">Netherlands</option>
                    <option value="DE">Germany</option>
                </select>
                <input id="cart-accept-tos" type="checkbox" required>
                <button id="checkout-btn" type="submit">
                    <span class="checkout-btn-text">Send Order</span>
                    <span class="checkout-btn-loading hidden">Sending...</span>
                </button>
            </form>
            
            <!-- Accordion Elements -->
            <div id="cart-items-toggle"></div>
            <div id="checkout-form-toggle"></div>
            <div id="cart-items-accordion"></div>
            <div id="checkout-form-accordion"></div>
            <div id="cart-items-content"></div>
            <div id="checkout-form-content"></div>
            <div id="cart-items-chevron"></div>
            <div id="checkout-form-chevron"></div>
            <button id="proceed-to-checkout"></button>
            
            <!-- Success/Error Messages -->
            <div id="cart-success-message" class="hidden"></div>
            <div id="cart-validation-messages" class="hidden"></div>
            <ul id="cart-validation-list"></ul>
        </body>
        </html>
    `, {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable'
    });
    
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Event = dom.window.Event;
    global.CustomEvent = dom.window.CustomEvent;
    
    // Mock isSecureContext to ensure clipboard API is used in tests
    Object.defineProperty(global.window, 'isSecureContext', {
        value: true,
        writable: true
    });
    
    // Mock localStorage
    global.localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
    };
    
    // Mock navigator with clipboard API
    global.navigator = {
        clipboard: {
            writeText: jest.fn().mockResolvedValue()
        }
    };
    
    // Mock window methods and location
    global.confirm = jest.fn();
    global.alert = jest.fn();
    global.setTimeout = jest.fn((fn) => fn());
    global.clearTimeout = jest.fn();
    
    // Mock window.location to prevent navigation errors
    Object.defineProperty(global.window, 'location', {
        value: {
            href: '',
            assign: jest.fn(),
            replace: jest.fn(),
            reload: jest.fn()
        },
        writable: true
    });
    
    // Mock Mustache
    global.Mustache = {
        render: jest.fn((template, data) => {
            // Simple mock implementation that returns basic HTML
            if (data.items && data.items.length > 0) {
                return data.items.map(item => 
                    `<div class="cart-item" data-id="${item.id}">
                        <h3>${item.name}</h3>
                        <p>€${item.price || 'N/A'}</p>
                        <p>Quantity: ${item.quantity}</p>
                        <p>Total: €${item.total || 'N/A'}</p>
                    </div>`
                ).join('');
            }
            return '<div>No items</div>';
        })
    };
    
    return dom;
};

describe('Shopping Cart - User Journey', () => {
    let cart;
    let dom;
    
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Create fresh DOM
        dom = createMockDOM();
        
        // Create new cart instance
        cart = new ShoppingCart();
    });
    
    afterEach(() => {
        // Clean up globals
        delete global.window;
        delete global.document;
        delete global.HTMLElement;
        delete global.Event;
        delete global.CustomEvent;
        delete global.localStorage;
        delete global.navigator;
        delete global.confirm;
        delete global.alert;
        delete global.setTimeout;
        delete global.clearTimeout;
        delete global.Mustache;
    });

    describe('When a customer visits the art shop', () => {
        it('should start with an empty cart', () => {
            // Given a customer visits the shop
            // When they check their cart
            // Then it should be empty
            expect(cart.items).toHaveLength(0);
            expect(cart.count).toBe(0);
            expect(cart.total).toBe(0);
        });

        it('should have all necessary elements cached', () => {
            // Given the cart is initialized
            // Then all form elements should be cached (or null if missing)
            expect(cart.elements).toBeDefined();
            expect(cart.cartTemplate).toBeDefined();
        });
    });

    describe('When a customer adds items to their cart', () => {
        it('should add a single art piece successfully', () => {
            // Given a customer finds an art piece they like
            const artPiece = TestDataFactory.createProduct();
            
            // When they add it to their cart
            CartActions.addProductToCart(cart, artPiece);
            
            // Then it should appear in their cart
            expect(cart.items).toHaveLength(1);
            expect(cart.items[0]).toMatchObject({
                id: artPiece.id,
                name: artPiece.name,
                price: artPiece.price,
                image: artPiece.image,
                quantity: 1
            });
            expect(cart.count).toBe(1);
            expect(cart.total).toBeCloseTo(29.99, 2);
        });

        it('should increase quantity when adding the same item twice', () => {
            // Given a customer adds an art piece to their cart
            const artPiece = TestDataFactory.createProduct();
            CartActions.addProductToCart(cart, artPiece);
            
            // When they add the same piece again
            CartActions.addProductToCart(cart, artPiece);
            
            // Then the quantity should increase
            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].quantity).toBe(2);
            expect(cart.count).toBe(2);
            expect(cart.total).toBeCloseTo(59.98, 2);
        });

        it('should handle multiple different art pieces', () => {
            // Given a customer adds multiple different art pieces
            const artPiece1 = TestDataFactory.createProduct({ id: 'art-1', price: 25.99 });
            const artPiece2 = TestDataFactory.createProduct({ id: 'art-2', price: 35.50 });
            
            // When they add both to their cart
            CartActions.addProductToCart(cart, artPiece1);
            CartActions.addProductToCart(cart, artPiece2);
            
            // Then both should be in their cart
            expect(cart.items).toHaveLength(2);
            expect(cart.count).toBe(2);
            expect(cart.total).toBeCloseTo(61.49, 2);
        });

        it('should allow updating item quantities', () => {
            // Given a customer has an item in their cart
            const artPiece = TestDataFactory.createProduct();
            CartActions.addProductToCart(cart, artPiece);
            const initialQuantity = cart.items[0].quantity;
            
            // When they increase the quantity by 2
            cart.updateQuantity(cart.items[0].id, initialQuantity, 2);
            
            // Then the quantity should be updated
            expect(cart.items[0].quantity).toBe(initialQuantity + 2);
            expect(cart.count).toBe(initialQuantity + 2);
        });

        it('should allow clearing the entire cart', () => {
            // Given a customer has items in their cart
            CartActions.addProductToCart(cart);
            expect(cart.items).toHaveLength(1);
            
            // When they clear their cart
            cart.clearCart();
            
            // Then the cart should be empty
            expect(cart.items).toHaveLength(0);
            expect(cart.count).toBe(0);
            expect(cart.total).toBe(0);
        });
    });

    describe('When a customer proceeds to checkout', () => {
        beforeEach(() => {
            // Given the customer has items in their cart
            CartActions.addProductToCart(cart);
        });

        describe('and fills out the checkout form', () => {
            it('should accept valid customer information', () => {
                // Given a customer fills out all required information correctly
                CartActions.fillValidForm(cart);
                
                // When the form is validated
                const isValid = cart.validateForm();
                
                // Then the form should be valid
                expect(isValid).toBe(true);
            });

            it('should reject incomplete customer information', () => {
                // Given a customer provides incomplete information
                if (cart.elements.nameField) cart.elements.nameField.value = 'A'; // Too short
                if (cart.elements.emailField) cart.elements.emailField.value = 'invalid-email';
                
                // When the form is validated
                const isValid = cart.validateForm();
                
                // Then the form should be invalid
                expect(isValid).toBe(false);
            });

            it('should require terms of service acceptance', () => {
                // Given a customer fills out all fields but doesn't accept TOS
                CartActions.fillValidForm(cart);
                if (cart.elements.tosField) cart.elements.tosField.checked = false;
                
                // When the form is validated
                const isValid = cart.validateForm();
                
                // Then the form should be invalid
                expect(isValid).toBe(false);
            });
        });
    });

    describe('When a customer completes their order', () => {
        it('should format the order email correctly', () => {
            // Given a customer has completed their order
            const orderData = TestDataFactory.createOrderData({
                items: [
                    { name: 'Abstract Art', quantity: 1, price: 25.99 },
                    { name: 'Landscape Photo', quantity: 2, price: 35.50 }
                ],
                total: 96.99
            });
            
            // When the order email is formatted
            const emailBody = cart.formatOrderEmail(orderData);
            
            // Then it should contain all order details
            expect(emailBody).toContain('John Doe');
            expect(emailBody).toContain('john@example.com');
            expect(emailBody).toContain('Main Street 123');
            expect(emailBody).toContain('Abstract Art');
            expect(emailBody).toContain('Landscape Photo');
            expect(emailBody).toContain('€96.99');
        });

        it('should handle the email sending process', async () => {
            // Given a customer confirms they want to send the order
            global.confirm.mockReturnValue(true);
            const orderData = TestDataFactory.createOrderData();
            
            // When the order email is sent
            await cart.sendOrderEmail(orderData);
            
            // Then it should attempt to copy to clipboard and show confirmation
            expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
            expect(global.confirm).toHaveBeenCalled();
        });
    });

    describe('When the system encounters errors', () => {
        it('should handle invalid product data gracefully', () => {
            // Given invalid product data (missing image)
            const invalidProduct = { id: 'test-1', name: 'Test Product', price: 10 };
            const initialLength = cart.items.length;
            
            // When attempting to add the invalid product
            cart.addItem(invalidProduct);
            
            // Then it should not be added to the cart
            expect(cart.items.length).toBe(initialLength);
        });

        it('should handle localStorage errors gracefully', () => {
            // Given corrupted localStorage data
            localStorage.getItem.mockReturnValue('invalid-json');
            
            // When attempting to load the cart
            // Then it should not throw an error
            expect(() => cart.loadCart()).not.toThrow();
            expect(cart.items).toEqual([]);
        });

        it('should handle clipboard API failures gracefully', async () => {
            // Given the clipboard API fails
            global.navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard failed'));
            global.confirm.mockReturnValue(true);
            const orderData = TestDataFactory.createOrderData();
            
            // When attempting to send an order email
            // Then it should not throw an error
            await expect(cart.sendOrderEmail(orderData)).resolves.toBeUndefined();
            expect(global.confirm).toHaveBeenCalled();
        });

        it('should handle missing form elements gracefully', () => {
            // Given form elements are missing from the DOM
            document.getElementById('checkout-form').remove();
            
            // When creating a new cart instance
            // Then it should not throw an error
            expect(() => {
                const newCart = new ShoppingCart();
            }).not.toThrow();
        });
    });

    describe('Data persistence', () => {
        it('should restore cart from localStorage on initialization', () => {
            // Given there is saved cart data in localStorage
            const savedItems = [
                TestDataFactory.createProduct({ quantity: 2 })
            ];
            localStorage.getItem.mockReturnValue(JSON.stringify(savedItems));
            
            // When loading the cart
            cart.loadCart();
            
            // Then the cart should be restored
            expect(cart.items).toEqual(savedItems);
        });

        it('should provide a factory for creating default customer info', () => {
            // When creating default customer info
            const defaultInfo = cart.createDefaultCustomerInfo();
            
            // Then it should have the expected structure
            expect(defaultInfo).toEqual({
                name: '',
                email: '',
                acceptedTos: false,
                address: {
                    street: '',
                    city: '',
                    postal: '',
                    country: ''
                }
            });
        });
    });
}); 