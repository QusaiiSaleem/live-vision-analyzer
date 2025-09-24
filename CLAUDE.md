# Claude Code Assistant Instructions

## Core Principles

### 1. Always Search Before Implementation
- **ALWAYS** use context7 MCP to search for understanding how the tech stack is being used before writing code
- Stay up-to-date with current best practices and patterns for the technologies involved
- Research the existing codebase patterns and conventions before making changes

### 2. Systematic Problem-Solving Approach
When encountering issues or bugs:
- **First**: Search context7 MCP for similar issues and their solutions
- **Second**: Look for documented patterns and known solutions
- **Third**: Check for existing implementations that solve similar problems
- **Never**: Resort to trial-and-error without proper research

### 3. Research-Driven Development
- Before implementing any solution, search for:
  - How other developers have solved similar problems
  - Community-approved solutions and patterns
  - Known pitfalls and their workarounds
- If initial searches don't yield results:
  - Expand search to find online resources where developers have figured out the solution
  - Look for blog posts, Stack Overflow answers, GitHub issues, and documentation

## Workflow Requirements

1. **Before writing any code**: Search context7 MCP for relevant patterns and implementations
2. **When facing errors**: Research the error thoroughly before attempting fixes
3. **For new features**: Find established patterns and best practices first
4. **Always verify**: Check if someone has already solved this problem before creating a new solution

## Key Reminder
❗ **No guessing or trial-and-error** - Every implementation should be backed by research and proven solutions from the community or existing codebase.

---

# User Preferences

- I am a product designer with little experience with coding - NOT a developer
- I need much more detailed explanations than you would give to a senior developer
- Always make smaller, incremental changes rather than large modifications
- I want to learn while coding, so break everything down into simple steps
- For larger or riskier changes, provide specific warnings and signals like "🚨 LARGE CHANGE ALERT" or "⚠️ HIGH RISK MODIFICATION"
- Always remind me to verify larger changes before they're implemented

## Be in Learning Mode

- When writing code or concepts, provide educational context and explanations. Break down complex topics into digestible parts, explain your reasoning process, and aim to help me understand not just what to do but why it works that way. Feel free to be more verbose in your explanations when teaching new concepts.
- When making code changes, explain each step of the way and break each code change down to its individual changes. Add additional comments for what you're doing and why that I can edit or remove as I see fit.
- Add warnings for auto-accepting code changes, especially ones that are larger or more complex so that I can review and learn from them.
- Use clear visual signals and emojis when making larger or riskier changes
- Always pause and wait for my confirmation before implementing significant modifications

---

# Live Vision Analyzer - Autonomous Self-Learning Architecture

## 🧠 System Philosophy
**"Autonomous > Configured"** - The system learns and adapts without human intervention, working in ANY business environment with ZERO configuration.

## 🏗️ System Overview
Fully autonomous, self-learning vision analysis system that requires NO configuration, NO zones, and NO manual setup. Works instantly in any business environment and improves continuously through pattern learning.

## 🎯 Core Principles

### 1. **Zero Configuration**
- Plug camera → Start monitoring
- No zones to draw
- No areas to define
- No thresholds to set
- Works immediately in ANY business

### 2. **Self-Learning Intelligence**
- Learns your business patterns automatically
- Improves daily without human input
- Adapts to changes (layout, schedule, season)
- Builds understanding progressively

### 3. **Business Agnostic**
- Works in retail, restaurants, warehouses, clinics, etc.
- Auto-detects business type from observations
- Adapts analysis to business context
- No industry-specific configuration needed

## 📊 Architecture Components

### 1. **Universal Detection Layer (YOLO)**
- **Model**: YOLO11n (2.6MB) - Lightweight nano model
- **Processing**: 10-15 FPS continuous monitoring
- **Coverage**: FULL FRAME - no zones needed
- **Output**: Raw object detection across entire view

### 2. **Context Inference Engine**
- **Purpose**: Understands WHAT is happening from WHERE objects are
- **Learning**: Builds understanding over time
- **Adaptation**: Adjusts to your specific business
- **Intelligence**: Creates "virtual zones" automatically

### 3. **Pattern Learning System**
```
Hour 1: Basic object detection
Day 1: Identifies common patterns
Week 1: Learns business rhythms
Month 1: Predicts and prevents issues
Continuous: Keeps improving forever
```

### 4. **Intelligent Analysis Layer (LLaVA)**
- **Model**: LLaVA 7B 4-bit quantized (2.7GB)
- **Activation**: Only when context demands it
- **Prompts**: Dynamically selected based on inferred context
- **Evolution**: Prompts improve based on learned patterns

## 🔄 How It Works

### **Universal Pattern Recognition**
Instead of zones, the system recognizes universal patterns that work everywhere:

```typescript
UNIVERSAL_PATTERNS = {
  // Human Behavior Patterns
  "queue_formation": "Multiple people in line",
  "browsing": "Person moving slowly near displays",
  "waiting": "Person stationary for extended time",
  "rushing": "Rapid movement patterns",

  // Spatial Patterns
  "congestion": "High density of people",
  "empty_area": "Unusual lack of activity",
  "blocked_path": "Obstruction in walkway",

  // Operational Patterns
  "service_point": "Person behind counter/desk",
  "transaction": "Exchange at fixed point",
  "stocking": "Moving items to shelves",

  // Safety Patterns
  "fall_risk": "Liquid on floor",
  "crowd_surge": "Sudden group movement",
  "abandoned_item": "Unattended package"
}
```

### **Progressive Learning Timeline**

#### **First Hour - Observation**
- Counts objects and people
- Identifies equipment and fixtures
- Maps movement patterns
- Detects interaction points

#### **First Day - Understanding**
- Recognizes business type
- Identifies peak/quiet periods
- Learns typical behaviors
- Establishes baselines

#### **First Week - Adaptation**
- Customizes triggers to your patterns
- Learns what's normal vs unusual
- Identifies recurring events
- Optimizes detection accuracy

#### **First Month - Intelligence**
- Predicts issues before they occur
- Provides actionable insights
- Suggests optimizations
- Becomes business expert

## 🎮 Multi-Camera Architecture

### **Automatic Camera Role Assignment**
Cameras automatically understand their purpose:

```typescript
Camera_1 → Observes checkout activity → "Transaction Monitor"
Camera_2 → Sees entrance/exit → "Traffic Analyzer"
Camera_3 → Views storage area → "Inventory Tracker"
```

### **Cross-Camera Intelligence**
- Track customers across cameras
- Correlate events between views
- Build complete operational picture
- No manual configuration needed

## 📈 Self-Learning Mechanisms

### **1. Implicit Learning**
System learns from normal operations:
- Peak times from crowd patterns
- Service speeds from queue flow
- Popular areas from dwell times
- Safety risks from near-misses

### **2. Pattern Reinforcement**
Frequently seen patterns gain confidence:
- "Every morning: crowd at entrance" → Morning rush detected
- "Afternoon: long queues" → Lunch rush pattern
- "Evening: restocking activity" → Closing routine identified

### **3. Anomaly Detection**
Identifies unusual events automatically:
- "Never seen 20 people here before" → Alert
- "Usually takes 2 minutes, today 10" → Investigate
- "Movement in closed area" → Security check

## 🚀 Implementation Flow

```
Cameras Start
    ↓
Universal YOLO Detection (Full Frame)
    ↓
Context Inference (What's happening?)
    ↓
Pattern Matching (Seen before?)
    ↓
Learning Update (Remember this)
    ↓
Smart Triggering (Important enough?)
    ↓
Dynamic Analysis (Right questions)
    ↓
Actionable Output (What to do)
```

## 💾 Data Structure (No Image Storage)

```typescript
interface AutonomousEvent {
  // Core Event
  id: string;
  timestamp: Date;

  // Inferred Context (not configured)
  detected_context: string;  // "checkout_queue", "entrance_crowd"
  business_type: string;     // Auto-detected
  confidence: number;         // How sure system is

  // Learned Patterns
  pattern_match: string;      // Which pattern triggered
  historical_context: {       // How this compares to normal
    typical: boolean;
    deviation_score: number;
  };

  // Analysis
  ai_analysis: {
    description: string;
    metrics: any;           // Context-specific
    recommendations: string[];
  };

  // Learning Feedback
  learning_data: {
    pattern_id: string;
    reinforcement: number;
    new_pattern: boolean;
  };
}
```

## 🎯 Business Type Auto-Detection

System identifies business type from observations:

### **Retail Indicators**
- Shopping carts, checkout counters, product shelves
- → Monitors: Queues, inventory, customer service

### **Restaurant Indicators**
- Tables, kitchen door, wait staff, menus
- → Monitors: Wait times, table turnover, service flow

### **Healthcare Indicators**
- Waiting room, reception, medical equipment
- → Monitors: Patient flow, wait times, privacy

### **Warehouse Indicators**
- Forklifts, pallets, shipping doors, safety gear
- → Monitors: Safety compliance, efficiency, inventory

## 🔧 Technical Specifications

### **Performance**
- YOLO: ~100MB RAM, 20ms inference
- Context Engine: ~50MB RAM, instant
- Learning DB: ~100MB growing slowly
- LLaVA: 4-6GB when active (on-demand)

### **Accuracy Timeline**
- Hour 1: 60% context accuracy
- Day 1: 75% context accuracy
- Week 1: 85% context accuracy
- Month 1: 95%+ context accuracy

### **Scalability**
- Cameras: Unlimited (parallel processing)
- Patterns: Unlimited learning capacity
- Business Types: Any type, auto-detected
- Locations: Portable knowledge

## ✨ Key Advantages

### **For Product Designers (You!)**
- No technical setup required
- Works immediately
- Improves automatically
- Adapts to changes

### **For Any Business**
- No configuration needed
- Works in any industry
- Learns your specific needs
- Scales with growth

### **System Benefits**
- True plug-and-play
- Self-improving AI
- Zero maintenance
- Future-proof design

## 🚦 Status Indicators

```typescript
interface SystemIntelligence {
  // What system has learned
  business_type_detected: string;
  patterns_learned: number;
  accuracy_confidence: number;
  hours_of_observation: number;

  // Current understanding
  identified_contexts: string[];
  peak_periods: TimeRange[];
  typical_patterns: Pattern[];

  // Improvements
  accuracy_trend: "improving" | "stable" | "learning";
  insights_available: number;
  recommendations: string[];
}
```

## 🎓 Learning Modes

### **Passive Learning** (Default)
- Observes and learns silently
- No user input needed
- Builds understanding automatically

### **Active Learning** (Optional)
- User can confirm/correct
- Accelerates learning
- Not required for operation

## 📝 Summary

This is not just a vision system - it's an **autonomous business intelligence platform** that:
- Requires ZERO configuration
- Works in ANY business
- Learns and improves FOREVER
- Adapts to changes AUTOMATICALLY

The future of vision analytics is not about configuration - it's about intelligence that emerges naturally from observation and learning.

---

## 🔧 Known Issues & Solutions

### **1. Tauri Parameter Naming Convention**
**Problem**: JavaScript uses camelCase but Tauri expects snake_case in Rust
**Solution**: Use camelCase in TypeScript/JavaScript - Tauri automatically converts to snake_case
```typescript
// TypeScript - use camelCase
await invoke('yolo_detect', {
  frameBase64: frame,  // NOT frame_base64
  model: 'yolo11n'
});
```

### **2. LLaVA/Ollama Timeout Issues**
**Problem**: LLaVA vision model times out when processing images
**Solutions Implemented**:
- Increased timeout from 10s to 30s
- Added `keep_alive` parameter to keep model loaded in memory
- Optimized LLaVA parameters for faster processing
- Added model preloading at startup to avoid cold starts
- Implemented quick analysis mode for first 10 minutes that skips LLaVA

```rust
// Optimized LLaVA settings in Rust
let json_payload = serde_json::json!({
    "model": "llava:7b",
    "prompt": prompt,
    "images": [frame_base64],
    "stream": false,
    "keep_alive": "5m",  // Keep model loaded
    "options": {
        "temperature": 0.3,
        "num_predict": 200,  // Limit response length
        "num_ctx": 2048,     // Smaller context window
        "num_thread": 4      // Prevent overload
    }
});
```

### **3. Property Initialization in TypeScript Classes**
**Problem**: Properties used before initialization causing undefined errors
**Solution**: Always initialize class properties
```typescript
// Always initialize properties
private patternDatabase: Map<string, any> = new Map();
```

### **4. Async Camera Setup**
**Problem**: Camera not ready when monitoring starts
**Solution**: Make setup functions async and await camera initialization
```typescript
const toggleMonitoring = async () => {
  await startCamera();  // Wait for camera to be ready
  await eventMonitor.startMonitoring();
};
```

### **5. Real vs Synthetic Data**
**Problem**: Synthetic/fake events don't represent real business activity
**Solution**:
- Process ONLY real camera frames
- YOLO detector should analyze actual image data (brightness, complexity)
- Never generate fake events for production use

### **6. Model Selection**
**Problem**: Wrong LLaVA model variant specified
**Solution**: Use the correct model name
```rust
// Correct model name
"model": "llava:7b"
// NOT "llava:7b-v1.6-mistral-q4_0" (doesn't exist)
```

## 🎯 Best Practices for This Project

1. **Always use real camera data** - No synthetic events in production
2. **Test with actual Tauri desktop app** - Not in browser (Tauri API won't be available)
3. **Monitor Rust compilation** - Check `npm run tauri dev` output for errors
4. **Use quick analysis mode** during learning phase to avoid timeouts
5. **Keep models preloaded** to avoid cold start delays
6. **Use context7 MCP** when debugging Ollama/LLaVA issues
7. **Check console logs** in the Tauri desktop app DevTools, not browser

## 📊 Performance Optimization Tips

- **YOLO**: Runs at 10-15 FPS, processes full frame (no zones)
- **LLaVA**: Only triggered for significant events after learning phase
- **Learning Phase**: First 10 minutes uses quick analysis (no LLaVA)
- **Memory**: Keep models loaded with `keep_alive` parameter
- **Timeouts**: 30s for LLaVA, can be increased if needed

## 🚀 Quick Debugging Checklist

When events aren't showing:
1. ✅ Check if camera is active and capturing frames
2. ✅ Verify YOLO is processing real image data
3. ✅ Check if events are being generated but filtered out
4. ✅ Verify LLaVA isn't timing out (check console)
5. ✅ Ensure using Tauri desktop app, not browser
6. ✅ Check Rust compilation succeeded
7. ✅ Verify Ollama is running and model is loaded