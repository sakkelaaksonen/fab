/**
 * @fileoverview TDD tests for email service functionality
 * @description Tests for EmailService class and EmailServiceError
 * @jest-environment jsdom
 */

const { EmailService, EmailServiceError } = require('../emailService.js');

describe('EmailServiceError', () => {
    test('should create error with message', () => {
        const error = new EmailServiceError('Test error');
        expect(error.message).toBe('Test error');
        expect(error.name).toBe('EmailServiceError');
        expect(error instanceof Error).toBe(true);
    });

    test('should create error with error type', () => {
        const error = new EmailServiceError('Network error', 'NETWORK_ERROR');
        expect(error.message).toBe('Network error');
        expect(error.type).toBe('NETWORK_ERROR');
        expect(error.name).toBe('EmailServiceError');
        expect(error instanceof Error).toBe(true);
    });
});

describe('EmailService.validateOrderData', () => {
    test('should accept valid order data', () => {
        const validOrder = {
            items: [
                { id: 'prod-1', name: 'Test Product', price: 29.99, quantity: 2, image: 'test.jpg' }
            ],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    postal: '12345',
                    country: 'US'
                }
            },
            total: 59.98,
            timestamp: new Date().toISOString()
        };

        expect(() => {
            EmailService.validateOrderData(validOrder);
        }).not.toThrow();
    });

    test('should reject order data without items', () => {
        const invalidOrder = {
            items: [],
            customer: { name: 'John', email: 'john@example.com' },
            total: 0,
            timestamp: new Date().toISOString()
        };

        expect(() => {
            EmailService.validateOrderData(invalidOrder);
        }).toThrow(EmailServiceError);
    });

    test('should reject order data without customer', () => {
        const invalidOrder = {
            items: [{ id: 'prod-1', name: 'Test', price: 10, quantity: 1 }],
            total: 10,
            timestamp: new Date().toISOString()
        };

        expect(() => {
            EmailService.validateOrderData(invalidOrder);
        }).toThrow(EmailServiceError);
    });

    test('should reject order data with invalid total', () => {
        const invalidOrder = {
            items: [{ id: 'prod-1', name: 'Test', price: 10, quantity: 1 }],
            customer: { name: 'John', email: 'john@example.com' },
            total: -10,
            timestamp: new Date().toISOString()
        };

        expect(() => {
            EmailService.validateOrderData(invalidOrder);
        }).toThrow(EmailServiceError);
    });

    test('should reject order data without timestamp', () => {
        const invalidOrder = {
            items: [{ id: 'prod-1', name: 'Test', price: 10, quantity: 1 }],
            customer: { name: 'John', email: 'john@example.com' },
            total: 10
        };

        expect(() => {
            EmailService.validateOrderData(invalidOrder);
        }).toThrow(EmailServiceError);
    });
});

describe('EmailService.sanitizeOrderData', () => {
    test('should sanitize customer information', () => {
        const orderData = {
            items: [
                { id: 'prod-1', name: '<script>Test</script> Product', price: 29.99, quantity: 1, image: 'test.jpg' }
            ],
            customer: {
                name: '  <script>John</script> Doe  ',
                email: '  JOHN@EXAMPLE.COM  ',
                acceptedTos: true,
                address: {
                    street: '  123 <b>Main</b> St  ',
                    city: '  Anytown  ',
                    postal: '  12345  ',
                    country: '  US  '
                }
            },
            total: 29.99,
            timestamp: new Date().toISOString()
        };

        const sanitized = EmailService.sanitizeOrderData(orderData);
        
        expect(sanitized.customer.name).toBe('John Doe');
        expect(sanitized.customer.email).toBe('john@example.com');
        expect(sanitized.customer.address.street).toBe('123 Main St');
        expect(sanitized.items[0].name).toBe('Test Product');
    });

    test('should handle missing optional fields', () => {
        const orderData = {
            items: [
                { id: 'prod-1', name: 'Test Product', quantity: 1, image: 'test.jpg' }
            ],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    postal: '12345',
                    country: 'US'
                }
            },
            total: 0,
            timestamp: new Date().toISOString()
        };

        const sanitized = EmailService.sanitizeOrderData(orderData);
        expect(sanitized.items[0].price).toBeUndefined();
    });

    test('should preserve numeric values', () => {
        const orderData = {
            items: [
                { id: 'prod-1', name: 'Test Product', price: 29.99, quantity: 2, image: 'test.jpg' }
            ],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    postal: '12345',
                    country: 'US'
                }
            },
            total: 59.98,
            timestamp: new Date().toISOString()
        };

        const sanitized = EmailService.sanitizeOrderData(orderData);
        expect(sanitized.total).toBe(59.98);
        expect(sanitized.items[0].price).toBe(29.99);
        expect(sanitized.items[0].quantity).toBe(2);
    });
});

describe('EmailService.formatOrderEmail', () => {
    test('should format complete order email', () => {
        const orderData = {
            items: [
                { id: 'prod-1', name: 'Handmade Bowl', price: 29.99, quantity: 2, image: 'bowl.jpg' },
                { id: 'prod-2', name: 'Ceramic Mug', price: 15.50, quantity: 1, image: 'mug.jpg' }
            ],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    postal: '12345',
                    country: 'US'
                }
            },
            total: 75.48,
            timestamp: '2024-01-15T10:30:00.000Z'
        };

        const emailBody = EmailService.formatOrderEmail(orderData);
        
        expect(emailBody).toContain('New Order Details:');
        expect(emailBody).toContain('John Doe');
        expect(emailBody).toContain('john@example.com');
        expect(emailBody).toContain('123 Main St');
        expect(emailBody).toContain('Handmade Bowl');
        expect(emailBody).toContain('€29.99');
        expect(emailBody).toContain('Quantity: 2');
        expect(emailBody).toContain('€75.48');
    });

    test('should handle items without prices', () => {
        const orderData = {
            items: [
                { id: 'prod-1', name: 'Custom Item', quantity: 1, image: 'custom.jpg' }
            ],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    postal: '12345',
                    country: 'US'
                }
            },
            total: 0,
            timestamp: new Date().toISOString()
        };

        const emailBody = EmailService.formatOrderEmail(orderData);
        expect(emailBody).toContain('Price: €N/A');
        expect(emailBody).toContain('Total: €N/A');
    });

    test('should format timestamp correctly', () => {
        const orderData = {
            items: [{ id: 'prod-1', name: 'Test', quantity: 1, image: 'test.jpg' }],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    postal: '12345',
                    country: 'US'
                }
            },
            total: 10,
            timestamp: '2024-01-15T10:30:00.000Z'
        };

        const emailBody = EmailService.formatOrderEmail(orderData);
        expect(emailBody).toContain('Order Date:');
        // Should contain a formatted date string
        expect(emailBody).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
});

describe('EmailService.createMailtoLink', () => {
    test('should create valid mailto link', () => {
        const subject = 'New Order from John Doe';
        const body = 'Order details...';
        
        const link = EmailService.createMailtoLink(subject, body);
        
        expect(link).toMatch(/^mailto:/);
        expect(link).toContain('subject=');
        expect(link).toContain('body=');
        expect(link).toContain(encodeURIComponent(subject));
        expect(link).toContain(encodeURIComponent(body));
    });

    test('should handle special characters in subject and body', () => {
        const subject = 'Order #123 & Special Characters!';
        const body = 'Line 1\nLine 2\n€29.99';
        
        const link = EmailService.createMailtoLink(subject, body);
        
        expect(link).toContain(encodeURIComponent(subject));
        expect(link).toContain(encodeURIComponent(body));
        expect(link).toMatch(/^mailto:/);
    });

    test('should use default recipient', () => {
        const link = EmailService.createMailtoLink('Test', 'Body');
        expect(link).toContain('mailto:contact@example.com');
    });
});

describe('EmailService.sendOrderEmail', () => {
    // Mock window.location and window.confirm for testing
    const originalLocation = window.location;
    const originalConfirm = window.confirm;

    beforeEach(() => {
        delete window.location;
        window.location = { href: '' };
        window.confirm = jest.fn();
    });

    afterEach(() => {
        window.location = originalLocation;
        window.confirm = originalConfirm;
    });

    test('should create mailto link and prompt user', async () => {
        window.confirm.mockReturnValue(true);

        const orderData = {
            items: [{ id: 'prod-1', name: 'Test Product', price: 10, quantity: 1, image: 'test.jpg' }],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    postal: '12345',
                    country: 'US'
                }
            },
            total: 10,
            timestamp: new Date().toISOString()
        };

        await EmailService.sendOrderEmail(orderData);

        expect(window.confirm).toHaveBeenCalledWith(
            expect.stringContaining('Click OK to open your email client')
        );
        expect(window.location.href).toContain('mailto:');
    });

    test('should not open email client if user cancels', async () => {
        window.confirm.mockReturnValue(false);

        const orderData = {
            items: [{ id: 'prod-1', name: 'Test', quantity: 1, image: 'test.jpg' }],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: { street: '123 Main St', city: 'Anytown', postal: '12345', country: 'US' }
            },
            total: 10,
            timestamp: new Date().toISOString()
        };

        await EmailService.sendOrderEmail(orderData);

        expect(window.confirm).toHaveBeenCalled();
        expect(window.location.href).toBe('');
    });

    test('should validate order data before sending', async () => {
        const invalidOrderData = {
            items: [],
            customer: null,
            total: -10
        };

        await expect(EmailService.sendOrderEmail(invalidOrderData))
            .rejects.toThrow(EmailServiceError);
    });

    test('should sanitize order data before sending', async () => {
        window.confirm.mockReturnValue(true);

        const orderData = {
            items: [{ id: 'prod-1', name: '<script>Test</script>', quantity: 1, image: 'test.jpg' }],
            customer: {
                name: '<script>John</script> Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: { street: '123 Main St', city: 'Anytown', postal: '12345', country: 'US' }
            },
            total: 10,
            timestamp: new Date().toISOString()
        };

        await EmailService.sendOrderEmail(orderData);

        expect(window.location.href).toContain('Test'); // Script tags should be removed
        expect(window.location.href).not.toContain('<script>');
    });
});

describe('EmailService integration tests', () => {
    test('should handle complete email workflow', async () => {
        const originalConfirm = window.confirm;
        window.confirm = jest.fn().mockReturnValue(true);

        const orderData = {
            items: [
                { id: 'prod-1', name: 'Handmade Bowl', price: 29.99, quantity: 2, image: 'bowl.jpg' }
            ],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    postal: '12345',
                    country: 'US'
                }
            },
            total: 59.98,
            timestamp: new Date().toISOString()
        };

        await EmailService.sendOrderEmail(orderData);

        expect(window.confirm).toHaveBeenCalled();
        expect(window.location.href).toContain('mailto:contact@example.com');
        expect(window.location.href).toContain('New%20Order%20from%20John%20Doe');

        window.confirm = originalConfirm;
    });

    test('should maintain data integrity through sanitization', () => {
        const orderData = {
            items: [{ id: 'prod-1', name: 'Test Product', price: 29.99, quantity: 1, image: 'test.jpg' }],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                acceptedTos: true,
                address: { street: '123 Main St', city: 'Anytown', postal: '12345', country: 'US' }
            },
            total: 29.99,
            timestamp: new Date().toISOString()
        };

        const sanitized1 = EmailService.sanitizeOrderData(orderData);
        const sanitized2 = EmailService.sanitizeOrderData(sanitized1);

        expect(sanitized1).toEqual(sanitized2);
    });
}); 