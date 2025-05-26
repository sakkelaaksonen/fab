/**
 * @fileoverview TDD tests for input sanitization functionality
 * @description Tests for InputSanitizer class and SanitizationError
 * @jest-environment jsdom
 */

const { InputSanitizer, SanitizationError } = require('../sanitizer.js');

describe('SanitizationError', () => {
    test('should create error with message', () => {
        const error = new SanitizationError('Test error');
        expect(error.message).toBe('Test error');
        expect(error.name).toBe('SanitizationError');
        expect(error instanceof Error).toBe(true);
    });

    test('should create error with field information', () => {
        const error = new SanitizationError('Invalid field', 'email');
        expect(error.message).toBe('Invalid field');
        expect(error.field).toBe('email');
        expect(error.name).toBe('SanitizationError');
        expect(error instanceof Error).toBe(true);
    });
});

describe('InputSanitizer.sanitizeString', () => {
    test('should remove HTML tags', () => {
        const input = '<script>alert("xss")</script>Hello World';
        const result = InputSanitizer.sanitizeString(input);
        expect(result).toBe('alert("xss")Hello World');
    });

    test('should remove javascript: protocols', () => {
        const input = 'javascript:alert(1)';
        const result = InputSanitizer.sanitizeString(input);
        expect(result).toBe('alert(1)');
    });

    test('should remove event handlers', () => {
        const input = 'onclick="alert(1)" Hello World';
        const result = InputSanitizer.sanitizeString(input);
        expect(result).toBe('Hello World');
    });

    test('should trim whitespace', () => {
        const input = '  Hello World  ';
        const result = InputSanitizer.sanitizeString(input);
        expect(result).toBe('Hello World');
    });

    test('should handle empty string', () => {
        const result = InputSanitizer.sanitizeString('');
        expect(result).toBe('');
    });

    test('should handle null and undefined', () => {
        expect(InputSanitizer.sanitizeString(null)).toBe('');
        expect(InputSanitizer.sanitizeString(undefined)).toBe('');
    });

    test('should convert non-strings to strings', () => {
        expect(InputSanitizer.sanitizeString(123)).toBe('123');
        expect(InputSanitizer.sanitizeString(true)).toBe('true');
    });
});

describe('InputSanitizer.sanitizeEmail', () => {
    test('should accept valid email addresses', () => {
        const validEmails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'user+tag@example.org'
        ];

        validEmails.forEach(email => {
            const result = InputSanitizer.sanitizeEmail(email);
            expect(result).toBe(email.toLowerCase());
        });
    });

    test('should convert email to lowercase', () => {
        const result = InputSanitizer.sanitizeEmail('TEST@EXAMPLE.COM');
        expect(result).toBe('test@example.com');
    });

    test('should reject invalid email formats', () => {
        const invalidEmails = [
            'invalid-email',
            '@example.com',
            'test@',
            '',
            null,
            undefined
        ];

        invalidEmails.forEach(email => {
            expect(() => {
                InputSanitizer.sanitizeEmail(email);
            }).toThrow(SanitizationError);
        });
    });

    test('should sanitize email content', () => {
        const result = InputSanitizer.sanitizeEmail('<script>test@example.com');
        expect(result).toBe('test@example.com');
    });
});

describe('InputSanitizer.validateRequired', () => {
    test('should accept valid non-empty strings', () => {
        const result = InputSanitizer.validateRequired('Hello World', 'name');
        expect(result).toBe('Hello World');
    });

    test('should trim whitespace', () => {
        const result = InputSanitizer.validateRequired('  Hello  ', 'name');
        expect(result).toBe('Hello');
    });

    test('should reject empty values', () => {
        const emptyValues = ['', '   ', null, undefined];

        emptyValues.forEach(value => {
            expect(() => {
                InputSanitizer.validateRequired(value, 'testField');
            }).toThrow(SanitizationError);
        });
    });

    test('should include field name in error', () => {
        try {
            InputSanitizer.validateRequired('', 'customerName');
        } catch (error) {
            expect(error.message).toContain('customerName');
            expect(error.field).toBe('customerName');
        }
    });
});

describe('InputSanitizer.sanitizeProduct', () => {
    test('should sanitize valid product data', () => {
        const product = {
            id: 'prod-123',
            name: 'Test Product',
            image: 'test.jpg',
            price: 29.99,
            quantity: 2
        };

        const result = InputSanitizer.sanitizeProduct(product);
        expect(result.id).toBe('prod-123');
        expect(result.name).toBe('Test Product');
        expect(result.image).toBe('test.jpg');
        expect(result.price).toBe(29.99);
        expect(result.quantity).toBe(2);
    });

    test('should handle missing optional fields', () => {
        const product = {
            id: 'prod-123',
            name: 'Test Product',
            image: 'test.jpg'
        };

        const result = InputSanitizer.sanitizeProduct(product);
        expect(result.price).toBeUndefined();
        expect(result.quantity).toBe(1);
    });

    test('should reject invalid product data', () => {
        const invalidProducts = [
            null,
            undefined,
            {},
            { id: '', name: 'test', image: 'test.jpg' },
            { id: 'test', name: '', image: 'test.jpg' },
            { id: 'test', name: 'test', image: '' }
        ];

        invalidProducts.forEach(product => {
            expect(() => {
                InputSanitizer.sanitizeProduct(product);
            }).toThrow(SanitizationError);
        });
    });

    test('should sanitize string fields', () => {
        const product = {
            id: '<script>prod-123</script>',
            name: '  Test <b>Product</b>  ',
            image: '  test.jpg  '
        };

        const result = InputSanitizer.sanitizeProduct(product);
        expect(result.id).toBe('prod-123');
        expect(result.name).toBe('Test Product');
        expect(result.image).toBe('test.jpg');
    });
});

describe('InputSanitizer.sanitizeCustomerInfo', () => {
    test('should sanitize valid customer data', () => {
        const customer = {
            name: 'John Doe',
            email: 'john@example.com',
            acceptedTos: true,
            address: {
                street: '123 Main St',
                city: 'Anytown',
                postal: '12345',
                country: 'US'
            }
        };

        const result = InputSanitizer.sanitizeCustomerInfo(customer);
        expect(result.name).toBe('John Doe');
        expect(result.email).toBe('john@example.com');
        expect(result.acceptedTos).toBe(true);
        expect(result.address.street).toBe('123 Main St');
    });

    test('should reject invalid customer data', () => {
        const invalidCustomers = [
            null,
            undefined,
            {},
            { name: '', email: 'test@example.com', acceptedTos: true },
            { name: 'John', email: 'invalid-email', acceptedTos: true },
            { name: 'John', email: 'test@example.com', acceptedTos: false }
        ];

        invalidCustomers.forEach(customer => {
            expect(() => {
                InputSanitizer.sanitizeCustomerInfo(customer);
            }).toThrow(SanitizationError);
        });
    });

    test('should sanitize string fields in customer data', () => {
        const customer = {
            name: '  <script>John</script> Doe  ',
            email: '  JOHN@EXAMPLE.COM  ',
            acceptedTos: true,
            address: {
                street: '  123 <b>Main</b> St  ',
                city: '  Anytown  ',
                postal: '  12345  ',
                country: '  US  '
            }
        };

        const result = InputSanitizer.sanitizeCustomerInfo(customer);
        expect(result.name).toBe('John Doe');
        expect(result.email).toBe('john@example.com');
        expect(result.address.street).toBe('123 Main St');
    });

    test('should require address object', () => {
        const customer = {
            name: 'John Doe',
            email: 'john@example.com',
            acceptedTos: true
        };

        expect(() => {
            InputSanitizer.sanitizeCustomerInfo(customer);
        }).toThrow(SanitizationError);
    });
}); 