mod ollama_manager;
mod yolo_detector;
mod moondream_manager;

use ollama_manager::{OllamaManager, OllamaStatus};
use yolo_detector::{YoloDetector, DetectionData};
use moondream_manager::{MoondreamManager, AnalysisResult};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{Manager, State};
use tokio::sync::Mutex;

#[derive(Clone)]
struct AppState {
    ollama: Arc<Mutex<OllamaManager>>,
    yolo: Arc<Mutex<YoloDetector>>,
    moondream: Arc<Mutex<MoondreamManager>>,
}

#[derive(Serialize, Deserialize)]
struct AnalyzeRequest {
    image_base64: String,
    prompt: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct AnalyzeResponse {
    description: String,
    error: Option<String>,
}

#[tauri::command]
async fn start_ollama(state: State<'_, AppState>) -> Result<String, String> {
    let mut ollama = state.ollama.lock().await;
    ollama.start().await?;

    // Pull the vision model
    println!("Pulling vision model...");
    ollama.pull_model("llava:7b").await?;

    Ok("Ollama started and model ready".to_string())
}

#[tauri::command]
async fn check_ollama_status(_state: State<'_, AppState>) -> Result<OllamaStatus, String> {
    println!("check_ollama_status called!");

    // Call the static method directly without holding any locks
    let status = OllamaManager::check_status().await;
    println!("Ollama status received: {:?}", status);

    Ok(status)
}

#[tauri::command]
async fn analyze_image(
    _state: State<'_, AppState>,
    request: AnalyzeRequest,
) -> Result<AnalyzeResponse, String> {
    println!("analyze_image called!");
    println!("Image base64 length: {}", request.image_base64.len());
    println!("Prompt: {:?}", request.prompt);

    // Check if Ollama is running
    let status = OllamaManager::check_status().await;
    println!("Ollama status: running={}, model_ready={}", status.running, status.model_ready);

    if !status.running || !status.model_ready {
        println!("Ollama not ready, returning error");
        return Ok(AnalyzeResponse {
            description: String::new(),
            error: Some("Ollama not ready".to_string()),
        });
    }

    // Make request to Ollama API with timeout
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let prompt = request.prompt.unwrap_or_else(||
        "Describe what you see in this image in 2-3 sentences. Focus on the main subjects and activities.".to_string()
    );

    println!("Sending request to Ollama API...");
    let json_payload = serde_json::json!({
        "model": "llava:7b",
        "prompt": prompt,
        "images": [request.image_base64],
        "stream": false
    });

    let response = client
        .post("http://127.0.0.1:11434/api/generate")
        .json(&json_payload)
        .send()
        .await
        .map_err(|e| {
            println!("Failed to send request to Ollama: {}", e);
            format!("Failed to analyze image: {}", e)
        })?;

    println!("Ollama API response status: {}", response.status());

    if !response.status().is_success() {
        let status_text = response.status().to_string();
        let error_text = response.text().await.unwrap_or_default();
        println!("Analysis failed with status {}: {}", status_text, error_text);
        return Ok(AnalyzeResponse {
            description: String::new(),
            error: Some(format!("Analysis failed: {} - {}", status_text, error_text)),
        });
    }

    let response_text = response.text().await
        .map_err(|e| {
            println!("Failed to read response text: {}", e);
            format!("Failed to read response: {}", e)
        })?;

    println!("Response text length: {}", response_text.len());

    let result: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|e| {
            println!("Failed to parse JSON response: {}", e);
            println!("Response was: {}", response_text);
            format!("Failed to parse response: {}", e)
        })?;

    let description = result["response"]
        .as_str()
        .unwrap_or("No description available")
        .to_string();

    println!("Analysis successful, description length: {}", description.len());

    Ok(AnalyzeResponse {
        description,
        error: None,
    })
}

#[tauri::command]
async fn capture_camera_frame() -> Result<String, String> {
    // This will be handled by the frontend using WebRTC
    // Returning a placeholder for now
    Ok("Camera capture handled by frontend".to_string())
}

// New command for YOLO detection
#[tauri::command]
async fn yolo_detect(
    state: State<'_, AppState>,
    frame_base64: String,
    _model: Option<String>,
) -> Result<DetectionData, String> {
    let detector = state.yolo.lock().await;
    detector.detect(&frame_base64).await
}

// New command for event-triggered LLaVA analysis
#[tauri::command]
async fn analyze_with_llava(
    _state: State<'_, AppState>,
    frame_base64: String,
    prompt: String,
    timeout: Option<u64>,
) -> Result<serde_json::Value, String> {
    println!("analyze_with_llava called with custom prompt");

    // Check if Ollama is running
    let status = OllamaManager::check_status().await;
    if !status.running || !status.model_ready {
        return Err("Ollama not ready".to_string());
    }

    // Set timeout (default 30 seconds to handle LLaVA processing)
    let timeout_duration = std::time::Duration::from_millis(timeout.unwrap_or(30000));

    let client = reqwest::Client::builder()
        .timeout(timeout_duration)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Use the installed llava:7b model with optimized settings
    let json_payload = serde_json::json!({
        "model": "llava:7b",
        "prompt": prompt,
        "images": [frame_base64],
        "stream": false,
        "keep_alive": "5m",  // Keep model loaded for 5 minutes
        "options": {
            "temperature": 0.3,  // Lower temperature for more consistent output
            "num_predict": 200,  // Reduce response length for faster processing
            "num_ctx": 2048,     // Smaller context window for vision tasks
            "num_thread": 4      // Limit threads to prevent overload
        }
    });

    let response = client
        .post("http://127.0.0.1:11434/api/generate")
        .json(&json_payload)
        .send()
        .await
        .map_err(|e| format!("Failed to analyze: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Analysis failed: {}", response.status()));
    }

    let result: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Try to parse the LLaVA response as JSON if possible
    if let Some(response_text) = result["response"].as_str() {
        // Try to parse as JSON first
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(response_text) {
            return Ok(json);
        }
    }

    Ok(result)
}

// Phase 1 POC: Moondream 3 MoE Integration Commands

#[tauri::command]
async fn analyze_with_moondream(
    state: State<'_, AppState>,
    frame_base64: String,
    prompt: String,
) -> Result<AnalysisResult, String> {
    println!("🌙 analyze_with_moondream called");
    let moondream = state.moondream.lock().await;
    moondream.query(frame_base64, prompt).await
}

#[tauri::command]
async fn moondream_caption(
    state: State<'_, AppState>,
    frame_base64: String,
    length: Option<String>,
) -> Result<AnalysisResult, String> {
    println!("🌙 moondream_caption called");
    let moondream = state.moondream.lock().await;
    moondream.caption(frame_base64, length).await
}

#[tauri::command]
async fn moondream_detect(
    state: State<'_, AppState>,
    frame_base64: String,
    object: String,
) -> Result<AnalysisResult, String> {
    println!("🌙 moondream_detect called");
    let moondream = state.moondream.lock().await;
    moondream.detect(frame_base64, object).await
}

#[tauri::command]
async fn moondream_point(
    state: State<'_, AppState>,
    frame_base64: String,
    object: String,
) -> Result<AnalysisResult, String> {
    println!("🌙 moondream_point called");
    let moondream = state.moondream.lock().await;
    moondream.point(frame_base64, object).await
}

#[tauri::command]
async fn moondream_analyze_retail(
    state: State<'_, AppState>,
    frame_base64: String,
    scene_type: String,
) -> Result<AnalysisResult, String> {
    println!("🌙 moondream_analyze_retail called for scene: {}", scene_type);
    let moondream = state.moondream.lock().await;
    moondream.analyze_retail_scene(frame_base64, &scene_type).await
}

#[tauri::command]
async fn check_moondream_status(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🌙 check_moondream_status called");
    let moondream = state.moondream.lock().await;
    moondream.check_status().await
}

// A/B Testing Command - Compare LLaVA vs Moondream
#[tauri::command]
async fn analyze_ab_test(
    state: State<'_, AppState>,
    frame_base64: String,
    prompt: String,
) -> Result<serde_json::Value, String> {
    println!("🔬 Running A/B test: LLaVA vs Moondream");

    let start_time = std::time::Instant::now();

    // Run both analyses concurrently
    let (llava_result, moondream_result) = tokio::join!(
        analyze_with_llava_internal(&state, frame_base64.clone(), prompt.clone()),
        analyze_with_moondream_internal(&state, frame_base64, prompt)
    );

    let total_time = start_time.elapsed().as_millis() as u64;

    Ok(serde_json::json!({
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "llava": llava_result,
        "moondream": moondream_result,
        "total_comparison_time_ms": total_time,
        "test_id": uuid::Uuid::new_v4().to_string()
    }))
}

// Internal helper functions for A/B testing
async fn analyze_with_llava_internal(
    state: &State<'_, AppState>,
    frame_base64: String,
    prompt: String,
) -> serde_json::Value {
    match analyze_with_llava(state.clone(), frame_base64, prompt, Some(30000)).await {
        Ok(result) => serde_json::json!({
            "success": true,
            "result": result,
            "provider": "llava"
        }),
        Err(error) => serde_json::json!({
            "success": false,
            "error": error,
            "provider": "llava"
        })
    }
}

async fn analyze_with_moondream_internal(
    state: &State<'_, AppState>,
    frame_base64: String,
    prompt: String,
) -> serde_json::Value {
    match analyze_with_moondream(state.clone(), frame_base64, prompt).await {
        Ok(result) => serde_json::json!({
            "success": true,
            "result": result,
            "provider": "moondream"
        }),
        Err(error) => serde_json::json!({
            "success": false,
            "error": error,
            "provider": "moondream"
        })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let ollama_manager = OllamaManager::new(&app.handle());
            let mut yolo_detector = YoloDetector::new();

            // Initialize Moondream manager with API key from environment
            let moondream_api_key = std::env::var("MOONDREAM_API_KEY")
                .unwrap_or_else(|_| {
                    eprintln!("⚠️ MOONDREAM_API_KEY not found in environment");
                    "".to_string()
                });

            let moondream_manager = MoondreamManager::new(moondream_api_key);
            println!("🌙 Moondream 3 MoE Manager initialized");

            // Initialize YOLO detector
            tauri::async_runtime::block_on(async {
                if let Err(e) = yolo_detector.initialize().await {
                    eprintln!("Failed to initialize YOLO: {}", e);
                }
            });

            let app_state = AppState {
                ollama: Arc::new(Mutex::new(ollama_manager)),
                yolo: Arc::new(Mutex::new(yolo_detector)),
                moondream: Arc::new(Mutex::new(moondream_manager)),
            };

            app.manage(app_state);

            // Start Ollama in background
            let state = app.state::<AppState>();
            let state_clone = state.inner().clone();

            tauri::async_runtime::spawn(async move {
                println!("Starting embedded Ollama...");
                if let Err(e) = state_clone.ollama.lock().await.start().await {
                    eprintln!("Failed to start Ollama: {}", e);
                } else {
                    println!("Ollama started successfully");
                    // Pull the standard llava model
                    if let Err(e) = state_clone.ollama.lock().await.pull_model("llava:7b").await {
                        eprintln!("Failed to pull model: {}", e);
                    } else {
                        println!("Model pulled successfully, preloading...");

                        // Preload the model to avoid cold starts
                        let client = reqwest::Client::new();
                        let preload_payload = serde_json::json!({
                            "model": "llava:7b",
                            "keep_alive": "10m"  // Keep loaded for 10 minutes
                        });

                        if let Err(e) = client
                            .post("http://127.0.0.1:11434/api/generate")
                            .json(&preload_payload)
                            .send()
                            .await
                        {
                            eprintln!("Failed to preload model: {}", e);
                        } else {
                            println!("LLaVA model preloaded and ready!");
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_ollama,
            check_ollama_status,
            analyze_image,
            capture_camera_frame,
            yolo_detect,
            analyze_with_llava,
            // Phase 1 POC: Moondream 3 MoE commands
            analyze_with_moondream,
            moondream_caption,
            moondream_detect,
            moondream_point,
            moondream_analyze_retail,
            check_moondream_status,
            analyze_ab_test
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}