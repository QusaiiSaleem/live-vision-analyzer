// Custom LLaVA Prompts for Retail Operation Analysis
// These prompts are designed to extract structured data from visual analysis

import { EventType } from '../types/analysis';

// Map of event types to their specialized prompts
export const OPERATION_PROMPTS: Record<EventType, string> = {
  // Queue Management Analysis
  queue_forming: `
    Analyze the checkout/service queue in this image and provide a detailed assessment.

    Please identify and report:
    1. EXACT count of people waiting in the queue (be precise)
    2. Estimated wait time in minutes based on queue length
    3. Overall customer mood/demeanor (calm, neutral, frustrated, or angry)
    4. Whether additional staff should be called (yes/no)
    5. Any customers who appear to need special assistance

    Format your response as JSON with this structure:
    {
      "people_count": <number>,
      "estimated_wait_minutes": <number>,
      "customer_mood": "calm|neutral|frustrated|angry",
      "staff_needed": <boolean>,
      "queue_length_meters": <number>,
      "special_assistance_needed": <boolean>,
      "observations": "<any additional relevant details>"
    }
  `,

  // Shelf Inventory Monitoring
  shelf_gap: `
    Analyze the retail shelf in this image for inventory status.

    Please identify and report:
    1. Number of products still visible on the shelf
    2. Percentage of shelf capacity currently used (0-100)
    3. Whether immediate restocking is needed (yes/no)
    4. Product categories/types visible (list them)
    5. Number of empty spots or gaps
    6. Any products that appear misplaced or fallen

    Format your response as JSON with this structure:
    {
      "products_visible": <number>,
      "shelf_capacity_used": <percentage 0-100>,
      "restocking_needed": <boolean>,
      "product_categories": [<list of product types>],
      "empty_spots": <number>,
      "misplaced_items": <boolean>,
      "urgent_restock": <boolean>,
      "observations": "<additional details about shelf condition>"
    }
  `,

  // Safety Hazard Detection
  safety_alert: `
    Analyze this image for safety hazards or security concerns.

    Please identify and report:
    1. Type of hazard detected (spill, obstruction, damage, etc.)
    2. Whether immediate action is required (yes/no)
    3. Description of the affected area
    4. Severity level (low, medium, high)
    5. Estimated risk to customers/staff (0-100 scale)
    6. Recommended immediate actions

    Format your response as JSON with this structure:
    {
      "hazard_type": "<type of hazard>",
      "immediate_action": <boolean>,
      "affected_area": "<description>",
      "severity": "low|medium|high",
      "estimated_risk": <0-100>,
      "recommended_actions": [<list of actions>],
      "people_at_risk": <number>,
      "observations": "<additional safety concerns>"
    }
  `,

  // Customer Interest Analysis
  high_interest: `
    Analyze customer behavior and engagement in this retail area.

    Please identify and report:
    1. How long the customer appears to have been in this area
    2. What type of interaction they're having with products
    3. Which products they're examining (if visible)
    4. Their engagement level (browsing, interested, comparing, deciding)
    5. Likelihood of making a purchase (yes/no)
    6. Whether they need assistance

    Format your response as JSON with this structure:
    {
      "dwell_time_estimate": "<estimated time>",
      "interaction_type": "<description of behavior>",
      "products_examined": [<list of products if visible>],
      "engagement_level": "browsing|interested|comparing|deciding",
      "likely_to_purchase": <boolean>,
      "needs_assistance": <boolean>,
      "customer_count": <number>,
      "observations": "<additional behavioral insights>"
    }
  `,

  // Crowd Formation Detection
  crowd_gathering: `
    Analyze the crowd formation and density in this area.

    Please identify and report:
    1. Total number of people in the crowd
    2. Crowd density assessment (sparse, moderate, dense, overcrowded)
    3. Whether this represents a safety concern
    4. Apparent reason for gathering (if observable)
    5. Flow of movement (static, slow, normal, fast)
    6. Recommended actions for crowd management

    Format your response as JSON with this structure:
    {
      "crowd_size": <number>,
      "density_level": "sparse|moderate|dense|overcrowded",
      "safety_concern": <boolean>,
      "gathering_reason": "<observed reason if any>",
      "movement_flow": "static|slow|normal|fast",
      "recommended_actions": [<list of actions>],
      "estimated_area_coverage": <percentage>,
      "observations": "<additional crowd dynamics>"
    }
  `,

  // Low Inventory Alert
  inventory_low: `
    Analyze the inventory levels in this retail display or storage area.

    Please identify and report:
    1. Product categories with low stock
    2. Estimated number of units remaining
    3. Urgency of restocking (1-5 scale, 5 being most urgent)
    4. Which specific products need immediate attention
    5. Overall inventory health assessment
    6. Impact on customer experience if not restocked

    Format your response as JSON with this structure:
    {
      "low_stock_categories": [<list of categories>],
      "units_remaining": <estimated total>,
      "restock_urgency": <1-5>,
      "critical_products": [<list of products needing immediate restock>],
      "inventory_health": "critical|poor|fair|good",
      "customer_impact": "high|medium|low",
      "empty_shelf_percentage": <0-100>,
      "observations": "<additional inventory insights>"
    }
  `
};

// General fallback prompt for unexpected scenarios
export const FALLBACK_PROMPT = `
  Analyze this retail environment image and describe what you observe.
  Focus on:
  1. Number of people and their activities
  2. Product placement and inventory levels
  3. Any operational issues or concerns
  4. Safety or security observations
  5. Customer service needs

  Provide a structured summary of your observations.
`;

// Helper function to get the appropriate prompt
export function getPromptForEvent(eventType: EventType): string {
  return OPERATION_PROMPTS[eventType] || FALLBACK_PROMPT;
}

// Zone-specific prompt overrides (optional customization per zone)
export const ZONE_CUSTOM_PROMPTS: Record<string, string> = {
  'checkout_main': `
    Focus specifically on the main checkout area.
    Pay special attention to:
    - Payment terminal status
    - Cashier presence and activity
    - Customer payment methods being used
    - Any checkout equipment issues
  `,

  'entrance_door': `
    Monitor the entrance area for:
    - Customer flow (entering vs exiting)
    - Accessibility compliance
    - Door obstruction issues
    - Welcome/greeting opportunities
  `,

  'high_value_shelf': `
    For high-value merchandise:
    - Check for potential theft indicators
    - Verify security tag presence
    - Monitor customer handling of products
    - Note any suspicious behavior
  `
};

// Prompt modifiers based on time of day or special conditions
export const CONTEXTUAL_MODIFIERS = {
  peak_hours: `
    Note: This is during peak hours.
    Pay extra attention to crowd management and queue efficiency.
  `,

  closing_time: `
    Note: Near closing time.
    Check for customers who may need to complete purchases quickly.
  `,

  sale_event: `
    Note: Sale event in progress.
    Monitor for inventory depletion and crowd control needs.
  `
};

// Function to build complete prompt with context
export function buildCompletePrompt(
  eventType: EventType,
  zoneId?: string,
  context?: string[]
): string {
  let prompt = getPromptForEvent(eventType);

  // Add zone-specific instructions if available
  if (zoneId && ZONE_CUSTOM_PROMPTS[zoneId]) {
    prompt += '\n\nAdditional zone-specific instructions:\n' + ZONE_CUSTOM_PROMPTS[zoneId];
  }

  // Add contextual modifiers
  if (context && context.length > 0) {
    const modifiers = context
      .map(ctx => CONTEXTUAL_MODIFIERS[ctx as keyof typeof CONTEXTUAL_MODIFIERS])
      .filter(Boolean)
      .join('\n');

    if (modifiers) {
      prompt += '\n\nContext:\n' + modifiers;
    }
  }

  return prompt;
}

// Export validation function to ensure prompt responses are valid JSON
export function validatePromptResponse(response: string): boolean {
  try {
    JSON.parse(response);
    return true;
  } catch {
    return false;
  }
}

// Parse LLaVA response into structured data
export function parseAnalysisResponse(response: string, eventType: EventType): any {
  try {
    // First try to parse as JSON
    const parsed = JSON.parse(response);
    return parsed;
  } catch {
    // If not valid JSON, try to extract key information
    console.warn('Failed to parse JSON response, attempting text extraction');

    // Fallback parsing logic based on event type
    switch (eventType) {
      case 'queue_forming':
        return extractQueueMetrics(response);
      case 'shelf_gap':
        return extractInventoryStatus(response);
      case 'safety_alert':
        return extractSafetyInfo(response);
      default:
        return { description: response, parsed: false };
    }
  }
}

// Fallback text extraction functions
function extractQueueMetrics(text: string): any {
  const peopleMatch = text.match(/(\d+)\s*people/i);
  const waitMatch = text.match(/(\d+)\s*minutes?/i);

  return {
    people_count: peopleMatch ? parseInt(peopleMatch[1]) : 0,
    estimated_wait_minutes: waitMatch ? parseInt(waitMatch[1]) : 0,
    customer_mood: 'neutral',
    staff_needed: text.toLowerCase().includes('staff') || text.toLowerCase().includes('help'),
    observations: text
  };
}

function extractInventoryStatus(text: string): any {
  const productsMatch = text.match(/(\d+)\s*products?/i);
  const percentMatch = text.match(/(\d+)%/);

  return {
    products_visible: productsMatch ? parseInt(productsMatch[1]) : 0,
    shelf_capacity_used: percentMatch ? parseInt(percentMatch[1]) : 50,
    restocking_needed: text.toLowerCase().includes('restock') || text.toLowerCase().includes('empty'),
    observations: text
  };
}

function extractSafetyInfo(text: string): any {
  return {
    hazard_type: 'unknown',
    immediate_action: text.toLowerCase().includes('immediate') || text.toLowerCase().includes('urgent'),
    severity: text.toLowerCase().includes('high') ? 'high' : 'medium',
    observations: text
  };
}