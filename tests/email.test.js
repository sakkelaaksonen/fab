/**
 * @fileoverview BDD tests for email functionality
 * @description Tests for EmailService class
 * @jest-environment jsdom
 */

const { EmailService } = require('../email.js');

// Mock window.location.href
delete window.location;
window.location = { href: '' };

// Mock confirm dialog
global.confirm = jest.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn()
    }
});

// Mock document.execCommand for fallback clipboard
document.execCommand = jest.fn();

// Mock setTimeout to make tests run faster
global.setTimeout = jest.fn((callback) => callback());

describe('EmailService', () => {
    let emailService;
    
    beforeEach(() => {
        emailService = new EmailService();
        jest.clearAllMocks();
        window.location.href = '';
        
        // Reset window.isSecureContext for each test
        Object.defineProperty(window, 'isSecureContext', {
            value: true,
            writable: true,
            configurable: true
        });
    });

    describe('constructor', () => {
        it('should initialize with default recipient', () => {
            expect(emailService.defaultRecipient).toBe('contact@example.com');
        });
    });

    describe('sendOrderEmail', () => {
        const mockOrderData = {
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                address: {
                    street: '123 Main St',
                    city: 'Amsterdam',
                    postal: '1234 AB',
                    country: 'NL'
                }
            },
            items: [
                {
                    name: 'Test Product',
                    quantity: 2,
                    price: 25.50
                }
            ],
            total: 51.00,
            timestamp: '2024-01-01T12:00:00.000Z'
        };

        describe('when clipboard copy succeeds', () => {
            beforeEach(() => {
                navigator.clipboard.writeText.mockResolvedValue();
            });

            it('should copy order details to clipboard and show confirmation', async () => {
                confirm.mockReturnValue(true);
                
                await emailService.sendOrderEmail(mockOrderData);
                
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                    expect.stringContaining('New Order Details:')
                );
                expect(confirm).toHaveBeenCalledWith(
                    expect.stringContaining('Order details have been copied to your clipboard!')
                );
            });

            it('should open email client when user confirms', async () => {
                confirm.mockReturnValue(true);
                
                await emailService.sendOrderEmail(mockOrderData);
                
                expect(window.location.href).toContain('mailto:contact@example.com');
                expect(window.location.href).toContain('subject=');
                expect(window.location.href).toContain('body=');
            });

            it('should not open email client when user cancels', async () => {
                confirm.mockReturnValue(false);
                
                await emailService.sendOrderEmail(mockOrderData);
                
                expect(window.location.href).toBe('');
            });

            it('should resolve after user interaction', async () => {
                confirm.mockReturnValue(true);
                
                const promise = emailService.sendOrderEmail(mockOrderData);
                
                await expect(promise).resolves.toBeUndefined();
            });
        });

        describe('when clipboard copy fails', () => {
            beforeEach(() => {
                navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard failed'));
            });

            it('should show fallback confirmation dialog', async () => {
                confirm.mockReturnValue(true);
                
                await emailService.sendOrderEmail(mockOrderData);
                
                expect(confirm).toHaveBeenCalledWith(
                    expect.stringContaining('Click OK to open your email client')
                );
            });

            it('should still open email client when user confirms fallback', async () => {
                confirm.mockReturnValue(true);
                
                await emailService.sendOrderEmail(mockOrderData);
                
                expect(window.location.href).toContain('mailto:contact@example.com');
            });
        });

        describe('when an error occurs', () => {
            it('should handle clipboard errors gracefully and still resolve', async () => {
                // Mock clipboard to throw an error
                navigator.clipboard.writeText.mockImplementation(() => {
                    throw new Error('Test error');
                });
                
                confirm.mockReturnValue(true);
                
                // The promise should still resolve because errors are handled gracefully
                await expect(emailService.sendOrderEmail(mockOrderData)).resolves.toBeUndefined();
                
                // Should show the fallback dialog
                expect(confirm).toHaveBeenCalledWith(
                    expect.stringContaining('Click OK to open your email client')
                );
            });

            it('should reject when there is an unhandled error in the try block', async () => {
                // Mock formatOrderEmail to throw an error to test actual rejection
                jest.spyOn(emailService, 'formatOrderEmail').mockImplementation(() => {
                    throw new Error('Formatting error');
                });
                
                await expect(emailService.sendOrderEmail(mockOrderData)).rejects.toThrow('Formatting error');
            });
        });
    });

    describe('copyToClipboard', () => {
        const testText = 'Test clipboard content';

        describe('when modern clipboard API is available', () => {
            beforeEach(() => {
                // Ensure secure context
                Object.defineProperty(window, 'isSecureContext', {
                    value: true,
                    writable: true,
                    configurable: true
                });
            });

            it('should use navigator.clipboard.writeText', async () => {
                navigator.clipboard.writeText.mockResolvedValue();
                
                await emailService.copyToClipboard(testText);
                
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
            });

            it('should resolve when clipboard write succeeds', async () => {
                navigator.clipboard.writeText.mockResolvedValue();
                
                await expect(emailService.copyToClipboard(testText)).resolves.toBeUndefined();
            });

            it('should reject when clipboard write fails', async () => {
                const error = new Error('Clipboard error');
                navigator.clipboard.writeText.mockRejectedValue(error);
                
                await expect(emailService.copyToClipboard(testText)).rejects.toThrow('Clipboard error');
            });
        });

        describe('when modern clipboard API is not available', () => {
            let mockTextArea;
            
            beforeEach(() => {
                // Simulate no clipboard API or insecure context
                Object.defineProperty(window, 'isSecureContext', {
                    value: false,
                    writable: true,
                    configurable: true
                });
                
                // Mock DOM methods for fallback
                mockTextArea = {
                    value: '',
                    style: {},
                    focus: jest.fn(),
                    select: jest.fn()
                };
                
                document.createElement = jest.fn().mockReturnValue(mockTextArea);
                document.body.appendChild = jest.fn();
                document.body.removeChild = jest.fn();
            });

            it('should use fallback method with document.execCommand', async () => {
                document.execCommand.mockReturnValue(true);
                
                await emailService.copyToClipboard(testText);
                
                expect(document.createElement).toHaveBeenCalledWith('textarea');
                expect(mockTextArea.value).toBe(testText);
                expect(document.execCommand).toHaveBeenCalledWith('copy');
            });

            it('should resolve when execCommand succeeds', async () => {
                document.execCommand.mockReturnValue(true);
                
                await expect(emailService.copyToClipboard(testText)).resolves.toBeUndefined();
            });

            it('should reject when execCommand fails', async () => {
                document.execCommand.mockReturnValue(false);
                
                await expect(emailService.copyToClipboard(testText)).rejects.toThrow('Copy command failed');
            });

            it('should reject when execCommand throws error', async () => {
                document.execCommand.mockImplementation(() => {
                    throw new Error('ExecCommand error');
                });
                
                await expect(emailService.copyToClipboard(testText)).rejects.toThrow('ExecCommand error');
            });
        });
    });

    describe('formatOrderEmail', () => {
        const mockOrderData = {
            customer: {
                name: 'Jane Smith',
                email: 'jane@example.com',
                address: {
                    street: '456 Oak Ave',
                    city: 'Rotterdam',
                    postal: '5678 CD',
                    country: 'NL'
                }
            },
            items: [
                {
                    name: 'Ceramic Bowl',
                    quantity: 1,
                    price: 35.00
                },
                {
                    name: 'Wooden Sculpture',
                    quantity: 2,
                    price: 75.50
                }
            ],
            total: 186.00,
            timestamp: '2024-01-15T14:30:00.000Z'
        };

        it('should format complete order information', () => {
            const result = emailService.formatOrderEmail(mockOrderData);
            
            expect(result).toContain('New Order Details:');
            expect(result).toContain('Customer Information:');
            expect(result).toContain('Jane Smith');
            expect(result).toContain('jane@example.com');
        });

        it('should include shipping address', () => {
            const result = emailService.formatOrderEmail(mockOrderData);
            
            expect(result).toContain('Shipping Address:');
            expect(result).toContain('456 Oak Ave');
            expect(result).toContain('Rotterdam');
            expect(result).toContain('5678 CD');
            expect(result).toContain('NL');
        });

        it('should list all order items with details', () => {
            const result = emailService.formatOrderEmail(mockOrderData);
            
            expect(result).toContain('Order Items:');
            expect(result).toContain('1. Ceramic Bowl');
            expect(result).toContain('Quantity: 1');
            expect(result).toContain('Price: €35.00');
            expect(result).toContain('Total: €35.00');
            
            expect(result).toContain('2. Wooden Sculpture');
            expect(result).toContain('Quantity: 2');
            expect(result).toContain('Price: €75.50');
            expect(result).toContain('Total: €151.00');
        });

        it('should include order total', () => {
            const result = emailService.formatOrderEmail(mockOrderData);
            
            expect(result).toContain('Order Total: €186.00');
        });

        it('should include formatted timestamp', () => {
            const result = emailService.formatOrderEmail(mockOrderData);
            
            expect(result).toContain('Order Date:');
            expect(result).toContain('2024'); // Should contain year from timestamp
        });

        it('should include processing instructions', () => {
            const result = emailService.formatOrderEmail(mockOrderData);
            
            expect(result).toContain('Please process this order and contact the customer');
        });

        it('should handle items without prices', () => {
            const orderWithoutPrices = {
                ...mockOrderData,
                items: [
                    {
                        name: 'Custom Artwork',
                        quantity: 1,
                        price: undefined
                    }
                ],
                total: 0
            };
            
            const result = emailService.formatOrderEmail(orderWithoutPrices);
            
            expect(result).toContain('Custom Artwork');
            expect(result).toContain('Price: €N/A');
            expect(result).toContain('Total: €N/A');
        });
    });
}); 