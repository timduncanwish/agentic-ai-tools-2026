/**
 * PayPal Subscription Integration
 * Agentic AI Tools 2026
 *
 * Configuration and setup for PayPal subscription buttons
 */

// ============================================
// CONFIGURATION
// ============================================

// PayPal Client ID
// Replace with your actual PayPal Client ID from PayPal Developer Dashboard
// Sandbox (Testing): Use your sandbox client ID
// Production: Use your live client ID
const PAYPAL_CLIENT_ID = 'ASr6yp2CFUOx4bg8ADZQkDVPSbTd4g_FRaytICSlgfmFe1mBcXQO0NLMgHrCI0DgIFS2v8YDKc2UCTi1'; // Your Live PayPal Client ID

// Subscription Plan IDs
// Create these plans in PayPal Dashboard and replace the IDs
const SUBSCRIPTION_PLANS = {
    basic: 'P-BASIC_PLAN_ID',          // Replace with actual Basic Plan ID
    professional: 'P-PROFESSIONAL_PLAN_ID' // Replace with actual Professional Plan ID
};

// ============================================
// INITIALIZE PAYPAL BUTTONS
// ============================================

/**
 * Initialize PayPal subscription buttons
 */
function initializePayPalButtons() {
    // Check if PayPal SDK is loaded
    if (typeof paypal === 'undefined') {
        console.error('PayPal SDK not loaded');
        showError('Payment system is currently unavailable. Please try again later.');
        return;
    }

    // Get configuration (sandbox vs production)
    const isSandbox = PAYPAL_CLIENT_ID === 'test' || PAYPAL_CLIENT_ID.startsWith('sb');
    const baseUrl = isSandbox
        ? 'https://www.sandbox.paypal.com'
        : 'https://www.paypal.com';

    // Initialize Basic Plan Button
    paypal.Buttons({
        style: {
            layout: 'vertical',
            color:  'gold',
            shape:  'rect',
            label:  'subscribe'
        },

        // Create Subscription
        createSubscription: function(data, actions) {
            return actions.subscription.create({
                'plan_id': SUBSCRIPTION_PLANS.basic,
                'custom_id': generateCustomId('basic')
            });
        },

        // On Approval
        onApprove: function(data, actions) {
            handleSubscriptionSuccess(data, 'basic');
        },

        // On Error
        onError: function(err) {
            console.error('PayPal Basic Plan Error:', err);
            showError('Payment failed. Please try again or contact support.');
        },

        // On Cancel
        onCancel: function(data) {
            console.log('Basic Plan subscription cancelled');
            showInfo('Subscription cancelled. You can subscribe anytime.');
        }
    }).render('#paypal-button-container-basic').catch(function(error) {
        console.error('Failed to render Basic Plan button:', error);
        showFallbackButton('basic', SUBSCRIPTION_PLANS.basic);
    });

    // Initialize Professional Plan Button
    paypal.Buttons({
        style: {
            layout: 'vertical',
            color:  'blue',
            shape:  'rect',
            label:  'subscribe'
        },

        // Create Subscription
        createSubscription: function(data, actions) {
            return actions.subscription.create({
                'plan_id': SUBSCRIPTION_PLANS.professional,
                'custom_id': generateCustomId('professional')
            });
        },

        // On Approval
        onApprove: function(data, actions) {
            handleSubscriptionSuccess(data, 'professional');
        },

        // On Error
        onError: function(err) {
            console.error('PayPal Professional Plan Error:', err);
            showError('Payment failed. Please try again or contact support.');
        },

        // On Cancel
        onCancel: function(data) {
            console.log('Professional Plan subscription cancelled');
            showInfo('Subscription cancelled. You can subscribe anytime.');
        }
    }).render('#paypal-button-container-professional').catch(function(error) {
        console.error('Failed to render Professional Plan button:', error);
        showFallbackButton('professional', SUBSCRIPTION_PLANS.professional);
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique custom ID for the subscription
 */
function generateCustomId(plan) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${plan}_${timestamp}_${random}`;
}

/**
 * Handle successful subscription
 */
function handleSubscriptionSuccess(data, plan) {
    console.log('Subscription successful:', data);
    console.log('Subscription ID:', data.subscriptionID);
    console.log('Plan:', plan);

    // Store subscription info for future use
    const subscriptionInfo = {
        subscriptionId: data.subscriptionID,
        plan: plan,
        orderID: data.orderID,
        timestamp: new Date().toISOString()
    };

    // Save to localStorage (optional)
    try {
        localStorage.setItem('paypal_subscription', JSON.stringify(subscriptionInfo));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }

    // Redirect to success page
    const successUrl = new URL('/subscription-success.html', window.location.origin);
    successUrl.searchParams.set('plan', plan);
    successUrl.searchParams.set('subscription_id', data.subscriptionID);
    window.location.href = successUrl.toString();
}

/**
 * Show error message
 */
function showError(message) {
    // Create or update error message container
    let errorContainer = document.getElementById('paypal-error-message');

    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'paypal-error-message';
        errorContainer.className = 'paypal-message paypal-message-error';
        document.querySelector('.pricing-section').prepend(errorContainer);
    }

    errorContainer.textContent = message;
    errorContainer.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

/**
 * Show info message
 */
function showInfo(message) {
    // Create or update info message container
    let infoContainer = document.getElementById('paypal-info-message');

    if (!infoContainer) {
        infoContainer = document.createElement('div');
        infoContainer.id = 'paypal-info-message';
        infoContainer.className = 'paypal-message paypal-message-info';
        document.querySelector('.pricing-section').prepend(infoContainer);
    }

    infoContainer.textContent = message;
    infoContainer.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        infoContainer.style.display = 'none';
    }, 5000);
}

/**
 * Show fallback button if PayPal SDK fails to render
 */
function showFallbackButton(plan, planId) {
    const container = document.getElementById(`paypal-button-container-${plan}`);

    if (container) {
        container.innerHTML = `
            <a href="https://www.paypal.com/webapps/billing/subscriptions?plan_id=${planId}"
               target="_blank"
               class="quantum-btn quantum-btn-primary paypal-fallback-btn">
               Subscribe with PayPal →
            </a>
            <p class="paypal-fallback-note">This will open PayPal in a new tab</p>
        `;
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePayPalButtons);
} else {
    initializePayPalButtons();
}

// ============================================
// SETUP GUIDE
// ============================================

/*
 * TO SETUP PAYPAL SUBSCRIPTIONS:
 *
 * 1. CREATE PAYPAL BUSINESS ACCOUNT:
 *    - Go to https://www.paypal.com
 *    - Sign up for a Business account (free)
 *
 * 2. GET CLIENT ID:
 *    - Go to https://developer.paypal.com/dashboard
 *    - Create a new app
 *    - Copy your Client ID
 *    - Replace PAYPAL_CLIENT_ID above
 *
 * 3. CREATE SUBSCRIPTION PLANS:
 *    - In PayPal Developer Dashboard, go to "Subscriptions" -> "Plans"
 *    - Create two plans:
 *      a) Basic Member - $9/month
 *      b) Professional Member - $29/month
 *    - Copy each Plan ID and replace in SUBSCRIPTION_PLANS above
 *
 * 4. TEST IN SANDBOX:
 *    - Use sandbox credentials for testing
 *    - Get test accounts from https://developer.paypal.com/dashboard/accounts
 *
 * 5. GO LIVE:
 *    - Replace sandbox Client ID with live Client ID
 *    - Replace sandbox Plan IDs with live Plan IDs
 *
 * For detailed guide, see: https://developer.paypal.com/docs/subscriptions/
 */
