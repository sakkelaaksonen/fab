// Mock window.location
delete window.location;
window.location = {
    href: jest.fn()
};

// Mock alert
global.alert = jest.fn();

// Mock Event and CustomEvent
class MockEvent {
    constructor(type) {
        this.type = type;
        this.bubbles = false;
        this.cancelBubble = false;
        this.cancelable = false;
        this.composed = false;
        this.currentTarget = null;
        this.defaultPrevented = false;
        this.eventPhase = 0;
        this.isTrusted = false;
        this.returnValue = true;
        this.srcElement = null;
        this.target = null;
        this.timeStamp = Date.now();
    }

    composedPath() { return []; }
    preventDefault() { this.defaultPrevented = true; }
    stopImmediatePropagation() { this.cancelBubble = true; }
    stopPropagation() { this.cancelBubble = true; }
}

class MockCustomEvent extends MockEvent {
    constructor(type, options = {}) {
        super(type);
        this.detail = options.detail || null;
    }

    initCustomEvent(type, bubbles, cancelable, detail) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
        this.detail = detail;
    }
}

global.Event = MockEvent;
global.CustomEvent = MockCustomEvent; 