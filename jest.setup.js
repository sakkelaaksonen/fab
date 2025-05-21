// Mock window.location
delete window.location;
window.location = {
    href: jest.fn()
};

// Mock alert
global.alert = jest.fn();

// Mock CustomEvent
global.CustomEvent = class CustomEvent {
    constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
    }
}; 